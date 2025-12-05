// frontend/src/components/modals/ModalEditarProducto.jsx
import { useEffect, useState } from "react";
import { X, Pencil } from "lucide-react";
import { actualizarProducto } from "../../services/api";

export default function ModalEditarProducto({
  open,
  producto,
  onClose,
  onUpdated,
}) {
  const [form, setForm] = useState({
    nombre: "",
    codigo: "",
    stock: 0,
    stock_minimo: 0,
    fecha_vencimiento: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open && producto) {
      setForm({
        nombre: producto.nombre || "",
        codigo: producto.codigo || "",
        stock: producto.stock ?? 0,
        stock_minimo: producto.stock_minimo ?? 0,
        fecha_vencimiento: producto.fecha_vencimiento || "",
      });
      setError("");
    }
  }, [open, producto]);

  if (!open || !producto) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "stock" || name === "stock_minimo" ? Number(value || 0) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        nombre: form.nombre.trim(),
        codigo: form.codigo.trim() || null,
        stock: Number(form.stock) || 0,
        stock_minimo: Number(form.stock_minimo) || 0,
        fecha_vencimiento: form.fecha_vencimiento || null,
      };
      const res = await actualizarProducto(producto.id, payload);
      onUpdated && onUpdated(res.data);
      onClose && onClose();
    } catch (err) {
      console.error("Error actualizando producto:", err);
      setError("No se pudo actualizar el producto.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-slate-100 flex items-center justify-center">
              <Pencil className="h-4 w-4 text-slate-700" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Editar producto
              </p>
              <p className="text-xs text-slate-500">
                {producto?.nombre || "Producto"}
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
              Nombre del producto
            </label>
            <input
              type="text"
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">
              Código (opcional)
            </label>
            <input
              type="text"
              name="codigo"
              value={form.codigo}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">
                Stock
              </label>
              <input
                type="number"
                min="0"
                name="stock"
                value={form.stock}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">
                Stock mínimo
              </label>
              <input
                type="number"
                min="0"
                name="stock_minimo"
                value={form.stock_minimo}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">
              Fecha de vencimiento (opcional)
            </label>
            <input
              type="date"
              name="fecha_vencimiento"
              value={form.fecha_vencimiento || ""}
              onChange={handleChange}
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
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
