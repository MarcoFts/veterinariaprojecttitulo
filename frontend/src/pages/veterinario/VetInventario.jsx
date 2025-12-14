import { useEffect, useState } from "react";
import LayoutVet from "../../components/layout/LayoutVet";
import { Box, RefreshCw, AlertTriangle } from "lucide-react";
import { getProductos } from "../../services/api";

export default function VetInventario() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadProductos = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getProductos();
      const data = Array.isArray(res.data)
        ? res.data
        : res.data?.results || [];
      setProductos(data);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar los productos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProductos();
  }, []);

  const hayAlertas = (p) => p.alerta_stock || p.alerta_vencimiento;

  return (
    <LayoutVet>
      <div className="space-y-6">
        {/* HEADER */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-2xl bg-sky-100 flex items-center justify-center">
              <Box className="h-5 w-5 text-sky-600" />
            </div>
            <div>
              <h1 className="text-base md:text-lg font-semibold text-slate-900">
                Inventario de productos
              </h1>
              <p className="text-xs text-slate-500">
                Visualización de insumos y stock disponible.
              </p>
            </div>
          </div>

          <button
            onClick={loadProductos}
            disabled={loading}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Actualizar
          </button>
        </header>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            {error}
          </div>
        )}

        {/* RESUMEN */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <p className="text-[11px] text-slate-500">Total productos</p>
            <p className="text-lg font-semibold text-slate-900">
              {productos.length}
            </p>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-[11px] text-amber-700">Stock bajo</p>
              <p className="text-lg font-semibold text-amber-800">
                {productos.filter((p) => p.alerta_stock).length}
              </p>
            </div>
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          </div>

          <div className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-[11px] text-orange-700">Por vencer</p>
              <p className="text-lg font-semibold text-orange-800">
                {productos.filter((p) => p.alerta_vencimiento).length}
              </p>
            </div>
            <AlertTriangle className="h-5 w-5 text-orange-600" />
          </div>
        </section>

        {/* TABLA */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="text-xs font-semibold text-slate-700">
              Lista de productos
            </p>
          </div>

          {productos.length === 0 && !loading ? (
            <div className="px-4 py-6 text-center text-xs text-slate-500">
              No hay productos registrados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80">
                    <th className="px-4 py-2 text-left font-medium text-slate-500">
                      Producto
                    </th>
                    <th className="px-4 py-2 text-left font-medium text-slate-500">
                      Código
                    </th>
                    <th className="px-4 py-2 text-center font-medium text-slate-500">
                      Stock
                    </th>
                    <th className="px-4 py-2 text-center font-medium text-slate-500">
                      Stock mínimo
                    </th>
                    <th className="px-4 py-2 text-left font-medium text-slate-500">
                      Vencimiento
                    </th>
                    <th className="px-4 py-2 text-center font-medium text-slate-500">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {productos.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-slate-50 hover:bg-slate-50/60"
                    >
                      <td className="px-4 py-2 font-medium text-slate-900">
                        {p.nombre}
                      </td>
                      <td className="px-4 py-2 text-slate-600">
                        {p.codigo || "-"}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <span className="inline-flex rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-800">
                          {p.stock ?? 0}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-center text-slate-600">
                        {p.stock_minimo ?? 0}
                      </td>
                      <td className="px-4 py-2 text-slate-600">
                        {p.fecha_vencimiento || "-"}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {hayAlertas(p) ? (
                          <span className="inline-flex rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-600 border border-rose-200">
                            Revisar
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 border border-emerald-200">
                            OK
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </LayoutVet>
  );
}
