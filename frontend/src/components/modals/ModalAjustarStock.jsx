import { useMemo, useState } from "react";
import { X, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { crearMovimiento } from "../../services/api";

export default function ModalAjustarStock({
  open,
  producto,
  onClose,
  onSaved,
}) {
  const [tipo, setTipo] = useState("ingreso");
  const [cantidad, setCantidad] = useState(1);
  const [motivo, setMotivo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const stockActual = useMemo(() => Number(producto?.stock ?? 0), [producto]);

  if (!open || !producto) return null;

  const validar = () => {
    const c = Number(cantidad);
    if (!Number.isInteger(c) || c <= 0) return "La cantidad debe ser un entero > 0.";
    if (tipo === "salida" && c > stockActual) return `Stock insuficiente. Disponible: ${stockActual}`;
    return "";
  };

  const guardar = async () => {
    const msg = validar();
    if (msg) {
      setError(msg);
      return;
    }

    setLoading(true);
    setError("");

    try {
      await crearMovimiento({
        producto: producto.id,
        tipo,
        cantidad: Number(cantidad),
        motivo: motivo?.trim() || "",
      });

      onSaved?.(); // refresca inventario y/o movimientos
      onClose?.();
    } catch (e) {
      console.error(e);
      const detail =
        e?.response?.data?.detail ||
        (typeof e?.response?.data === "object"
          ? JSON.stringify(e.response.data)
          : null);
      setError(detail || "No se pudo registrar el movimiento.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Ajustar stock</h3>
            <p className="text-xs text-slate-600">
              {producto.nombre} · Stock actual: <span className="font-semibold">{stockActual}</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 px-5 py-4">
          {/* Tipo */}
          <div className="grid gap-2">
            <label className="text-xs font-semibold text-slate-700">Tipo</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTipo("ingreso")}
                className={`flex-1 rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                  tipo === "ingreso"
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                }`}
              >
                <span className="inline-flex items-center justify-center gap-2">
                  <ArrowUpCircle className="h-4 w-4" />
                  Ingreso
                </span>
              </button>

              <button
                type="button"
                onClick={() => setTipo("salida")}
                className={`flex-1 rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                  tipo === "salida"
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                }`}
              >
                <span className="inline-flex items-center justify-center gap-2">
                  <ArrowDownCircle className="h-4 w-4" />
                  Salida
                </span>
              </button>
            </div>
          </div>

          {/* Cantidad */}
          <div className="grid gap-2">
            <label className="text-xs font-semibold text-slate-700">Cantidad</label>
            <input
              type="number"
              min={1}
              step={1}
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
            />
            {tipo === "salida" && (
              <p className="text-xs text-slate-600">
                Máximo para salida: <span className="font-semibold">{stockActual}</span>
              </p>
            )}
          </div>

          {/* Motivo */}
          <div className="grid gap-2">
            <label className="text-xs font-semibold text-slate-700">Motivo (opcional)</label>
            <input
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej: Compra proveedor / Merma / Uso interno"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-4">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            onClick={guardar}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
