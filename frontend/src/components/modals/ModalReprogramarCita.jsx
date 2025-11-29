// src/components/modals/ModalReprogramarCita.jsx
import { useState, useEffect } from "react";
import { X, RefreshCw, CalendarDays, Clock } from "lucide-react";

export default function ModalReprogramarCita({
  open,
  onClose,
  cita,
  onConfirm,
}) {
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");

  useEffect(() => {
    if (open && cita) {
      setFecha("");
      setHora("");
    }
  }, [open, cita]);

  if (!open || !cita) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!fecha || !hora) return;

    const payload = {
      id: cita.id,
      nueva_fecha: fecha,
      nueva_hora: hora,
    };

    // Aquí en el futuro se llamará a reprogramarCita(cita.id, payload)
    if (onConfirm) onConfirm(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="modal-window w-full max-w-md rounded-2xl bg-white shadow-xl border border-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-sky-100 flex items-center justify-center">
              <RefreshCw className="text-sky-600" size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Reprogramar cita
              </p>
              <p className="text-xs text-slate-500">
                Actual: {cita.horaInicio} - {cita.horaFin}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 hover:bg-slate-100"
          >
            <X size={16} className="text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
              <CalendarDays size={13} />
              Nueva fecha
            </label>
            <input
              type="date"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500/60 focus:border-sky-500 bg-slate-50/60"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
              <Clock size={13} />
              Nueva hora
            </label>
            <input
              type="time"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500/60 focus:border-sky-500 bg-slate-50/60"
              value={hora}
              onChange={(e) => setHora(e.target.value)}
            />
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-xl bg-sky-500 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-600"
            >
              Guardar cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
