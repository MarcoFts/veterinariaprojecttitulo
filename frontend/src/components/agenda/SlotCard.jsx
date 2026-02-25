// src/components/agenda/SlotCard.jsx
import { CheckCircle2, Clock, XCircle } from "lucide-react";

export default function SlotCard({
  slot,
  onAsignar,
  onConfirm,
  onReprogramar,
  onCancelar,
}) {
  const { horaInicio, horaFin, estado, estadoCita, paciente, mascota, box } =
    slot;

  // estilos según estado principal (libre/ocupada/cancelada)
  const baseClasses =
    "flex items-center justify-between rounded-xl border px-4 py-3 text-sm";
  let stateClasses = "";
  if (estado === "libre") {
    stateClasses =
      "border-slate-200 bg-slate-50 hover:bg-slate-100 transition";
  } else if (estado === "cancelada") {
    stateClasses = "border-rose-100 bg-rose-50";
  } else {
    // ocupada (pendiente o confirmada)
    stateClasses = "border-emerald-100 bg-emerald-50";
  }

  const isPendiente = estado === "ocupada" && estadoCita !== "confirmada";
  const isConfirmada = estado === "ocupada" && estadoCita === "confirmada";

  return (
    <div className={`${baseClasses} ${stateClasses}`}>
      {/* IZQUIERDA: info */}
      <div className="flex items-start gap-3">
        <div className="mt-1">
          {estado === "cancelada" ? (
            <XCircle className="h-4 w-4 text-rose-500" />
          ) : (
            <Clock className="h-4 w-4 text-slate-500" />
          )}
        </div>

        <div>
          <p className="font-semibold text-slate-900">
            {horaInicio} - {horaFin}
          </p>

          {estado === "libre" && (
            <p className="text-xs text-slate-500">Horario libre</p>
          )}

          {estado !== "libre" && (
            <>
              <p className="text-xs text-slate-600">
                {paciente && (
                  <>
                    Paciente: <span className="font-medium">{paciente}</span>
                    {mascota && ` · ${mascota}`}
                  </>
                )}
              </p>

              {box && (
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Sala / Box: <span className="font-mono">{box}</span>
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* DERECHA: estado y acciones */}
      <div className="flex flex-col items-end gap-2">
        {/* etiqueta de estado */}
        {estado === "libre" && (
          <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700">
            Libre
          </span>
        )}

        {estado === "cancelada" && (
          <span className="inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-[11px] text-rose-700">
            Cancelada
          </span>
        )}

        {estado === "ocupada" && (
          <span
            className={
              "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] " +
              (isConfirmada
                ? "bg-emerald-100 text-emerald-700"
                : "bg-amber-100 text-amber-700")
            }
          >
            {isConfirmada ? (
              <>
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Confirmada
              </>
            ) : (
              "Pendiente"
            )}
          </span>
        )}

        {/* botones */}
        <div className="flex flex-wrap justify-end gap-2 mt-1">
          {estado === "libre" && onAsignar && (
            <button
              onClick={onAsignar}
              className="rounded-lg border border-sky-500 px-3 py-1 text-[11px] font-semibold text-sky-600 hover:bg-sky-50"
            >
              Asignar cita
            </button>
          )}

          {estado === "ocupada" && isPendiente && onConfirm && (
            <button
              onClick={onConfirm}
              className="rounded-lg bg-emerald-500 px-3 py-1 text-[11px] font-semibold text-white hover:bg-emerald-600"
            >
              Confirmar
            </button>
          )}

          {estado === "ocupada" && onReprogramar && (
            <button
              onClick={onReprogramar}
              className="rounded-lg bg-sky-500 px-3 py-1 text-[11px] font-semibold text-white hover:bg-sky-600"
            >
              Reprogramar
            </button>
          )}

          {estado !== "libre" && estado !== "cancelada" && onCancelar && (
            <button
              onClick={onCancelar}
              className="rounded-lg border border-rose-200 px-3 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
