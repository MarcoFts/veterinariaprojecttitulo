import React, { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { eliminarMascota } from "../../services/api";

export default function ModalEliminarMascota({
  mascota,
  onClose,
  onDeleted,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    setLoading(true);
    setError("");

    try {
      await eliminarMascota(mascota.id);
      onDeleted();
      onClose();
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        "No se pudo eliminar la mascota.";

      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-xl shadow-xl border border-neutral-200 w-full max-w-sm p-5 text-center animate-fadeScale">
        <div className="flex justify-end">
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <div className="flex justify-center mb-3">
          <AlertTriangle size={36} className="text-red-500" />
        </div>

        <h2 className="text-lg font-semibold text-slate-800 mb-2">
          Eliminar mascota
        </h2>

        <p className="text-sm text-slate-600 mb-4">
          ¿Estás seguro de eliminar a <strong>{mascota.nombre}</strong>?  
          Esta acción no se puede deshacer.
        </p>

        {error && (
          <p className="text-red-600 text-sm mb-3">
            {error}
          </p>
        )}

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg border text-sm"
          >
            Cancelar
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="flex-1 py-2 rounded-lg bg-red-600 text-white font-semibold text-sm disabled:opacity-60"
          >
            {loading ? "Eliminando…" : "Eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}
