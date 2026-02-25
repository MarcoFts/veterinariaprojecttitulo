import { useEffect, useMemo, useState } from "react";
import { Filter, RefreshCw } from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/es";
dayjs.locale("es");

import { getMovimientos, getProductos } from "../../services/api";

export default function AdminMovimientos() {
  const [movs, setMovs] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [fProducto, setFProducto] = useState("");
  const [fTipo, setFTipo] = useState("");

  const cargar = async () => {
    setLoading(true);
    setError("");
    try {
      const [mRes, pRes] = await Promise.all([
        getMovimientos({
          producto_id: fProducto || undefined,
          tipo: fTipo || undefined,
        }),
        getProductos(),
      ]);

      setMovs(mRes?.data || []);
      setProductos(pRes?.data || []);
    } catch (e) {
      console.error(e);
      setError("No se pudieron cargar los movimientos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fProducto, fTipo]);

  const rows = useMemo(() => movs || [], [movs]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Movimientos de inventario
          </h1>
          <p className="text-sm text-slate-600">
            Historial de ingresos y salidas (auditoría).
          </p>
        </div>

        <button
          onClick={cargar}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
        >
          <RefreshCw className="h-4 w-4" />
          Recargar
        </button>
      </div>

      {/* Filtros */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Filter className="h-4 w-4" />
          Filtros
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="grid gap-1">
            <label className="text-xs font-semibold text-slate-700">Producto</label>
            <select
              value={fProducto}
              onChange={(e) => setFProducto(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <option value="">Todos</option>
              {productos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-1">
            <label className="text-xs font-semibold text-slate-700">Tipo</label>
            <select
              value={fTipo}
              onChange={(e) => setFTipo(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <option value="">Todos</option>
              <option value="ingreso">Ingreso</option>
              <option value="salida">Salida</option>
            </select>
          </div>

          <div className="grid gap-1">
            <label className="text-xs font-semibold text-slate-700">Tip</label>
            <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
              Los movimientos no se editan ni se eliminan.
            </div>
          </div>
        </div>
      </div>

      {/* Estados */}
      {loading && <p className="text-sm text-slate-500">Cargando movimientos...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && rows.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">
          No hay movimientos para los filtros seleccionados.
        </div>
      )}

      {/* Tabla */}
      {!loading && !error && rows.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Fecha</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Producto</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Tipo</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Cantidad</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Motivo</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((m) => (
                <tr key={m.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-700">
                    {m.fecha ? dayjs(m.fecha).format("DD/MM/YYYY HH:mm") : "-"}
                  </td>

                  <td className="px-4 py-3 font-medium text-slate-900">
                    {m.producto_nombre || `#${m.producto}`}
                    {m.producto_codigo ? (
                      <div className="text-xs text-slate-500">Código: {m.producto_codigo}</div>
                    ) : null}
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-semibold ${
                        m.tipo === "ingreso"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-rose-50 text-rose-700"
                      }`}
                    >
                      {m.tipo === "ingreso" ? "Ingreso" : "Salida"}
                    </span>
                  </td>

                  <td className="px-4 py-3 font-semibold">{m.cantidad}</td>
                  <td className="px-4 py-3 text-slate-700">{m.motivo || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
