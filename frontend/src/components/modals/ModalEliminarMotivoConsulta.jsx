import { eliminarMotivoConsulta } from "../../services/api";
import { AlertTriangle, X } from "lucide-react";

export default function ModalEliminarMotivoConsulta({
  open,
  onClose,
  motivo,
  onDeleted,
}) {
  if (!open || !motivo) return null;

  const handleDelete = async () => {
    try {
      await eliminarMotivoConsulta(motivo.id);
      onDeleted(motivo.id);
      onClose();
    } catch (err) {
      console.error(err);
      alert("No se pudo eliminar el motivo.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-xs bg-white rounded-2xl shadow-xl border border-slate-200 animate-fadeScale">

        {/* HEADER */}
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-900">
            Confirmar eliminación
          </p>

          <button
            className="text-slate-500 hover:text-slate-700 transition"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        {/* CUERPO */}
        <div className="px-5 py-5 text-sm text-slate-700 flex flex-col items-start gap-3">

          {/* Ícono de advertencia */}
          <div className="flex items-center gap-2 text-rose-600">
            <AlertTriangle size={20} />
            <span className="font-semibold">¿Eliminar?</span>
          </div>

          <p className="leading-relaxed">
            Estás a punto de eliminar el motivo{" "}    
          </p>
        </div>

        {/* BOTONES */}
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 active:scale-[0.97] transition"
          >
            Cancelar
          </button>

          <button
            onClick={handleDelete}
            className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 active:scale-[0.97] transition"
          >
            Eliminar
          </button>
        </div>

      </div>
    </div>
  );
}
