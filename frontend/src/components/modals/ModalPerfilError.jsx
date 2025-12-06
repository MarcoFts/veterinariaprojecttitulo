import { X, AlertTriangle } from "lucide-react";

export default function ModalPerfilError({ open, message, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-rose-200 animate-fadeScale">
        
        <div className="flex items-center justify-between px-5 py-4 border-b border-rose-100">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-rose-50 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-rose-600" />
            </div>
            <p className="text-sm font-semibold text-rose-700">Error al guardar</p>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-slate-100 text-slate-500"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-5 text-sm text-slate-700">
          {message}
        </div>

        <div className="flex justify-end px-5 pb-4">
          <button
            onClick={onClose}
            className="rounded-xl bg-rose-600 text-white text-xs font-semibold px-4 py-2 hover:bg-rose-700"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
}
