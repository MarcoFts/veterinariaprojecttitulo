
import { useEffect, useState } from "react";
import { editarMotivoConsulta } from "../../services/api";
import { X } from "lucide-react";

export default function ModalEditarMotivoConsulta({
  open,
  onClose,
  motivo,
  onUpdated,
}) {
  const [nombre, setNombre] = useState("");
  const [codigo, setCodigo] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (motivo) {
      setNombre(motivo.nombre || "");
      setCodigo(motivo.codigo || "");
    }
  }, [motivo]);

  if (!open || !motivo) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    const payload = {
      nombre: nombre.trim(),
      codigo: codigo.trim() || nombre.toLowerCase().replace(/\s+/g, "_"),
    };

    setLoading(true);
    try {
      const res = await editarMotivoConsulta(motivo.id, payload);
      onUpdated(res.data);
      onClose();
    } catch (err) {
      console.error(err);
      alert("No se pudo editar el motivo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 shadow-xl animate-fadeScale">

        {/* HEADER */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-900">
            Editar motivo de consulta
          </p>

          <button
            className="text-slate-500 hover:text-slate-700 transition"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">

          <div>
            <label className="text-xs font-medium text-slate-600">
              Nombre
            </label>
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:ring-2 focus:ring-sky-300 outline-none transition"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600">
              Código
            </label>
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:ring-2 focus:ring-sky-300 outline-none transition"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
            />
          </div>

          {/* BOTONES */}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 active:scale-[0.97] transition"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-700 active:scale-[0.97] transition"
            >
              {loading ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
