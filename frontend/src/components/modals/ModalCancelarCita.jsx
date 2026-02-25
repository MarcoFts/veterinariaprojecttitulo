import React from "react";

export default function ModalCancelarCita({ open, onClose, onConfirm }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[9999]">
      <div className="bg-white p-6 rounded-xl shadow-xl w-[90%] max-w-sm border border-neutral-200 modal-window">

        <h2 className="text-lg font-semibold text-neutral-800 mb-3">
          ¿Cancelar cita?
        </h2>

        <p className="text-sm text-neutral-600 mb-4">
          Esta acción no se puede deshacer.
        </p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-neutral-200 text-neutral-700 hover:bg-neutral-300 transition"
          >
            No
          </button>

          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
          >
            Sí, cancelar
          </button>
        </div>

      </div>
    </div>
  );
}
