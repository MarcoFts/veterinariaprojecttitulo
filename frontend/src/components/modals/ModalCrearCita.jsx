// src/components/modals/ModalCrearCita.jsx
import { useState, useEffect } from "react";
import { X, CalendarDays, User, PawPrint } from "lucide-react";

const MOCK_CLIENTES = [
  { id: 1, nombre: "Juan Pérez" },
  { id: 2, nombre: "María López" },
];

const MOCK_MASCOTAS = [
  { id: 1, nombre: "Firulais" },
  { id: 2, nombre: "Michi" },
];

export default function ModalCrearCita({ open, onClose, slot, onConfirm }) {
  const [clienteId, setClienteId] = useState("");
  const [mascotaId, setMascotaId] = useState("");
  const [motivo, setMotivo] = useState("");
  const [box, setBox] = useState("");

  useEffect(() => {
    if (open) {
      setClienteId("");
      setMascotaId("");
      setMotivo("");
      setBox("");
    }
  }, [open]);

  if (!open || !slot) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!clienteId || !mascotaId || !motivo.trim()) return;

    const payload = {
      slot_id: slot.id,
      cliente_id: Number(clienteId),
      mascota_id: Number(mascotaId),
      motivo: motivo.trim(),
      box: box.trim() || null,
    };

    // Aquí en el futuro se llamará a crearCita(payload)
    if (onConfirm) onConfirm(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">

      <div className="modal-window w-full max-w-lg rounded-2xl bg-white shadow-xl border border-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-sky-100 flex items-center justify-center">
              <CalendarDays className="text-sky-600" size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Asignar cita
              </p>
              <p className="text-xs text-slate-500">
                {slot.horaInicio} - {slot.horaFin}
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
              <User size={13} />
              Cliente
            </label>
            <select
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500/60 focus:border-sky-500 bg-slate-50/60"
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
            >
              <option value="">Selecciona un cliente</option>
              {MOCK_CLIENTES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
              <PawPrint size={13} />
              Mascota
            </label>
            <select
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500/60 focus:border-sky-500 bg-slate-50/60"
              value={mascotaId}
              onChange={(e) => setMascotaId(e.target.value)}
            >
              <option value="">Selecciona una mascota</option>
              {MOCK_MASCOTAS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              Motivo de la cita
            </label>
            <textarea
              rows={3}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500/60 focus:border-sky-500 resize-none bg-slate-50/60"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej: Control anual, vacunación, cirugía menor..."
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              Box (opcional)
            </label>
            <input
              type="text"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500/60 focus:border-sky-500 bg-slate-50/60"
              value={box}
              onChange={(e) => setBox(e.target.value)}
              placeholder="BOX-1"
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
              Guardar cita
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
