import { X } from "lucide-react";

export default function ModalAgregarRegistro({ open, onClose, onSave }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 w-full max-w-xl animate-fadeIn p-6 relative">
        
        {/* Cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-slate-700 transition"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-xl font-semibold text-slate-900 mb-4">
          Nuevo registro clínico
        </h2>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave?.();
          }}
          className="space-y-4"
        >
          <div>
            <label classname="text-sm font-medium text-slate-700">Diagnóstico</label>
            <textarea
              required
              className="w-full mt-1 p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-sky-400 outline-none transition"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Procedimiento</label>
            <textarea
              className="w-full mt-1 p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-sky-400 outline-none transition"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Tratamiento</label>
            <textarea
              className="w-full mt-1 p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-sky-400 outline-none transition"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Medicamentos</label>
            <textarea
              className="w-full mt-1 p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-sky-400 outline-none transition"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Observaciones</label>
            <textarea
              className="w-full mt-1 p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-sky-400 outline-none transition"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-3 rounded-xl transition shadow-md shadow-sky-600/20"
          >
            Guardar registro
          </button>
        </form>
      </div>
    </div>
  );
}
