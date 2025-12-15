import { useEffect, useState } from "react";
import { X } from "lucide-react";

export default function ModalEditarProducto({ open, onClose, producto, onSave }) {
  const [form, setForm] = useState({
    nombre: "",
    categoria: "",
    codigo: "",
    laboratorio: "",
    lote: "",
    stock_minimo: 0,
    fecha_vencimiento: "",
  });

  useEffect(() => {
    if (!producto) return;
    setForm({
      nombre: producto.nombre || "",
      categoria: producto.categoria || "",
      codigo: producto.codigo || "",
      laboratorio: producto.laboratorio || "",
      lote: producto.lote || "",
      stock_minimo: producto.stock_minimo ?? 0,
      fecha_vencimiento: producto.fecha_vencimiento || "",
    });
  }, [producto]);

  if (!open) return null;

  const submit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-3">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-xl border border-slate-200">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-bold text-slate-900">Editar producto</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={submit} className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="md:col-span-2">
            <label className="text-xs text-slate-600">Nombre</label>
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
              value={form.nombre}
              onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
            />
          </div>

          <div>
            <label className="text-xs text-slate-600">Categoría</label>
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
              value={form.categoria}
              onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))}
            />
          </div>

          <div>
            <label className="text-xs text-slate-600">Código</label>
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
              value={form.codigo}
              onChange={(e) => setForm((f) => ({ ...f, codigo: e.target.value }))}
            />
          </div>

          <div>
            <label className="text-xs text-slate-600">Laboratorio</label>
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
              value={form.laboratorio}
              onChange={(e) => setForm((f) => ({ ...f, laboratorio: e.target.value }))}
            />
          </div>

          <div>
            <label className="text-xs text-slate-600">Lote</label>
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
              value={form.lote}
              onChange={(e) => setForm((f) => ({ ...f, lote: e.target.value }))}
            />
          </div>

          <div>
            <label className="text-xs text-slate-600">Stock mínimo</label>
            <input
              type="number"
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
              value={form.stock_minimo}
              onChange={(e) =>
                setForm((f) => ({ ...f, stock_minimo: Number(e.target.value || 0) }))
              }
            />
          </div>

          <div>
            <label className="text-xs text-slate-600">Fecha vencimiento</label>
            <input
              type="date"
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
              value={form.fecha_vencimiento || ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, fecha_vencimiento: e.target.value }))
              }
            />
          </div>

          <div className="md:col-span-2 flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border px-4 py-2 text-sm font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-xl bg-slate-900 text-white px-4 py-2 text-sm font-semibold"
            >
              Guardar cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
