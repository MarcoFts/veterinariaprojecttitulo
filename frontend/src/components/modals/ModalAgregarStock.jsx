// frontend/src/components/modals/ModalAgregarStock.jsx
import { useEffect, useState } from "react";
import { X, ArrowUpCircle } from "lucide-react";
import { agregarStockProducto } from "../../services/api";

export default function ModalAgregarStock({
  open,
  producto,
  onClose,
  onUpdated,
}) {
  const [cantidad, setCantidad] = useState(0);
  const [motivo, setMotivo] = useState("Ingreso de stock");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setCantidad(0);
      setMotivo("Ingreso de stock");
      setError("");
    }
  }, [open]);

  if (!open || !producto) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!cantidad || cantidad <= 0) {
      setError("La cantidad debe ser mayor a 0.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const resp = await agregarStockProducto({
        producto_id: producto.id,
        cantidad: Number(cantidad),
        motivo: motivo || "Ingreso de stock",
      });

      // backend devolverá { producto: {...} } o el producto directo
      const actualizado = resp.data?.producto || resp.data;
      if (actualizado && actualizado.id) {
        onUpdated && onUpdated(actualizado);
      }
      onClose && onClose();
    } catch (err) {
      console.error("Error al agregar stock:", err);
      setError("No se pudo agregar stock a este producto.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-sky-100 flex items-center justify-center">
              <ArrowUpCircle className="h-4 w-4 text-sky-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Agregar stock
              </p>
              <p className="text-xs text-slate-500">
                {producto?.nombre || "Producto"} · Stock actual:{" "}
                <span className="font-semibold">{producto?.stock ?? 0}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1 rounded-full hover:bg-slate-100 text-slate-500"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3 text-sm">
          {error && (
            <div className="rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-xs text-rose-700">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">
              Cantidad a ingresar
            </label>
            <input
              type="number"
              min="1"
              value={cantidad}
              onChange={(e) => setCantidad(Number(e.target.value || 0))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">
              Motivo (opcional)
            </label>
            <input
              type="text"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
            >
              {saving ? "Guardando..." : "Agregar stock"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
