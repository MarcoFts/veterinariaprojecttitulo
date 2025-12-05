// src/components/modals/ModalAgregarProducto.jsx
import { useState } from "react";
import { X, PackagePlus } from "lucide-react";
import { crearProducto } from "../../services/api";

export default function ModalAgregarProducto({ open, onClose, onCreated }) {
  const [form, setForm] = useState({
    nombre: "",
    codigo: "",
    categoria: "tratamiento",
    laboratorio: "",
    lote: "",
    stock: 0,
    stock_minimo: 0,
    fecha_vencimiento: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "stock" || name === "stock_minimo") {
      setForm((prev) => ({
        ...prev,
        [name]: Number(value || 0),
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = {
        nombre: form.nombre.trim(),
        codigo: form.codigo.trim() || null,
        categoria: form.categoria || "tratamiento",
        laboratorio: form.laboratorio.trim() || null,
        lote: form.lote.trim() || null,
        stock: Number(form.stock) || 0,
        stock_minimo: Number(form.stock_minimo) || 0,
        fecha_vencimiento: form.fecha_vencimiento || null,
      };

      const res = await crearProducto(payload);
      onCreated && onCreated(res.data);
      onClose && onClose();

      setForm({
        nombre: "",
        codigo: "",
        categoria: "tratamiento",
        laboratorio: "",
        lote: "",
        stock: 0,
        stock_minimo: 0,
        fecha_vencimiento: "",
      });
    } catch (err) {
      console.error("Error creando producto:", err);
      const detail =
        err?.response?.data?.detail ||
        err?.response?.data?.nombre ||
        err?.response?.data?.categoria ||
        "No se pudo crear el producto.";
      setError(
        Array.isArray(detail) ? detail.join(" | ") : String(detail)
      );
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
            <div className="h-8 w-8 rounded-xl bg-sky-100 flex items-center justify-center">
              <PackagePlus className="h-4 w-4 text-sky-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Nuevo producto
              </p>
              <p className="text-xs text-slate-500">
                Registra un nuevo insumo o medicamento.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 hover:bg-slate-100 text-slate-500"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          {error && (
            <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
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
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="Ej: Vacuna antirrábica"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">
              Código interno (opcional)
            </label>
            <input
              type="text"
              name="codigo"
              value={form.codigo}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="Ej: VAC-01"
            />
          </div>

          {/* Categoría */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">
              Categoría
            </label>
            <select
              name="categoria"
              value={form.categoria}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="tratamiento">Tratamiento / Medicamento</option>
              <option value="vacuna">Vacuna</option>
              <option value="antiparasitario">Antiparasitario</option>
              <option value="insumo">Insumo</option>
              <option value="otro">Otro</option>
            </select>
          </div>

          {/* 🆕 Laboratorio y lote */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">
                Laboratorio / Marca
              </label>
              <input
                type="text"
                name="laboratorio"
                value={form.laboratorio}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="Ej: Drag Pharma"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">
                Lote (batch)
              </label>
              <input
                type="text"
                name="lote"
                value={form.lote}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="Ej: A1234B"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">
                Stock inicial
              </label>
              <input
                type="number"
                min="0"
                name="stock"
                value={form.stock}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
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
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
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
              value={form.fecha_vencimiento}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
            >
              {saving ? "Guardando..." : "Guardar producto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
