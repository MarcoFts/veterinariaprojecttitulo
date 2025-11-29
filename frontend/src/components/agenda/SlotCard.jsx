// src/components/agenda/SlotCard.jsx
import { Clock, User, PawPrint, XCircle, RefreshCw, PlusCircle } from "lucide-react";

export default function SlotCard({
  slot,
  onAsignar,
  onReprogramar,
  onCancelar,
}) {
  const { horaInicio, horaFin, estado, paciente, mascota } = slot;

  const isLibre = estado === "libre";
  const isOcupada = estado === "ocupada";
  const isCancelada = estado === "cancelada";

  let baseClasses =
    "w-full flex items-center justify-between rounded-xl border px-3 py-2.5 text-sm transition-all duration-150";
  let stateClasses = "";

  if (isLibre) {
    stateClasses = "bg-white border-sky-100 hover:shadow-sm";
  } else if (isOcupada) {
    stateClasses = "bg-emerald-50 border-emerald-200";
  } else if (isCancelada) {
    stateClasses = "bg-rose-50 border-rose-200 opacity-70";
  }

  return (
    <div className={`${baseClasses} ${stateClasses}`}>
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center">
          <Clock size={18} className="text-slate-700" />
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-slate-800">
            {horaInicio} - {horaFin}
          </span>
          <span className="text-xs text-slate-500 capitalize">
            {estado}
            {isOcupada && paciente
              ? ` · ${paciente}${mascota ? ` · ${mascota}` : ""}`
              : null}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isLibre && (
          <button
            type="button"
            onClick={onAsignar}
            className="inline-flex items-center gap-1 rounded-lg bg-sky-500 px-2.5 py-1 text-xs font-semibold text-white hover:bg-sky-600"
          >
            <PlusCircle size={14} />
            Asignar
          </button>
        )}

        {isOcupada && (
          <>
            <button
              type="button"
              onClick={onReprogramar}
              className="inline-flex items-center gap-1 rounded-lg border border-sky-200 bg-white px-2.5 py-1 text-xs font-semibold text-sky-700 hover:bg-sky-50"
            >
              <RefreshCw size={14} />
              Reprogramar
            </button>
            <button
              type="button"
              onClick={onCancelar}
              className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-100"
            >
              <XCircle size={14} />
              Cancelar
            </button>
          </>
        )}

        {isCancelada && (
          <span className="text-[11px] text-rose-500 flex items-center gap-1">
            <XCircle size={14} />
            Cancelada
          </span>
        )}
      </div>
    </div>
  );
}
