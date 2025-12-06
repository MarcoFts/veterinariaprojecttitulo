import { X, CheckCircle2 } from "lucide-react";

export default function ModalPerfilSuccess({ open, message, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 animate-fadeScale">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="text-sm font-semibold text-slate-900">Operación exitosa</p>
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
            className="rounded-xl bg-emerald-600 text-white text-xs font-semibold px-4 py-2 hover:bg-emerald-700"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
