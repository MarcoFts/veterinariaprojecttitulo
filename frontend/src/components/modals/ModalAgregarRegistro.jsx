// src/components/modals/ModalAgregarRegistro.jsx
import { useState } from "react";
import { X } from "lucide-react";

export default function ModalAgregarRegistro({ open, onClose, onSave }) {
  const [motivoConsulta, setMotivoConsulta] = useState("");
  const [diagnostico, setDiagnostico] = useState("");
  const [error, setError] = useState("");

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!diagnostico.trim()) {
      setError("El diagnóstico es obligatorio.");
      return;
    }

    setError("");

    onSave({
      motivo_consulta: motivoConsulta,
      diagnostico,
      // más adelante aquí puedes sumar:
      // procedimientos, tratamientos, medicamentos, evolucion, notas...
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 w-full max-w-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-6 border-b border-slate-100">
          <h2 className="text-xl font-semibold text-slate-900">
            Nuevo registro clínico
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Ingresa el motivo y el diagnóstico de la consulta.
          </p>
          {error && (
            <p className="mt-2 text-xs text-rose-500">
              {error}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700">
              Motivo de consulta
            </label>
            <input
              type="text"
              value={motivoConsulta}
              onChange={(e) => setMotivoConsulta(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-sky-400 outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700">
              Diagnóstico <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={diagnostico}
              onChange={(e) => setDiagnostico(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-sky-400 outline-none min-h-[80px]"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm rounded-xl bg-sky-600 text-white font-semibold hover:bg-sky-700"
            >
              Guardar registro
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
