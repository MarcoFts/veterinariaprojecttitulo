// src/components/modals/ModalReprogramarCita.jsx
import { useEffect, useMemo, useState } from "react";
import {
  X,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
} from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/es";
import { getDisponibilidad, reprogramarCita } from "../../services/api";

dayjs.locale("es");

export default function ModalReprogramarCita({
  open,
  cita,          // { id, inicio, box, duracion }
  vetId,         // id del veterinario
  onClose,
  onConfirm,     // callback para refrescar estado en la vista padre
}) {
  const [selectedDate, setSelectedDate] = useState("");
  const [weekOffset, setWeekOffset] = useState(0);
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedHour, setSelectedHour] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // cuando se abre el modal o cambia la cita
  useEffect(() => {
    if (!open || !cita) return;

    const base = cita.inicio?.slice(0, 10) || dayjs().format("YYYY-MM-DD");
    setSelectedDate(base);
    setSelectedHour("");
    setError("");

    const diffDays = dayjs(base).diff(dayjs().startOf("day"), "day");
    const aligned = diffDays < 0 ? 0 : diffDays - (diffDays % 7);
    setWeekOffset(aligned);
  }, [open, cita]);

  // tira de días
  const upcomingDays = useMemo(() => {
    const base = dayjs().add(weekOffset, "day");
    return Array.from({ length: 7 }, (_, i) => {
      const d = base.add(i, "day");
      return {
        value: d.format("YYYY-MM-DD"),
        dia: d.format("DD"),
        dow: d.format("ddd"),
      };
    });
  }, [weekOffset]);

  const currentMonthLabel = useMemo(
    () => dayjs().add(weekOffset, "day").format("MMM YYYY"),
    [weekOffset]
  );

  const handleWeekNav = (direction) => {
    setWeekOffset((prev) => {
      const next = prev + (direction === "next" ? 7 : -7);
      const base = dayjs().add(next, "day");
      setSelectedDate(base.format("YYYY-MM-DD"));
      return next < 0 ? 0 : next;
    });
  };

  // cargar horarios disponibles para la fecha seleccionada
  useEffect(() => {
    const loadSlots = async () => {
      if (!open || !vetId || !selectedDate) return;

      setLoadingSlots(true);
      setSlots([]);
      setError("");

      try {
        const resp = await getDisponibilidad({
          veterinario_id: vetId,
          fecha: selectedDate,
          duracion: cita?.duracion || 30,
          box: "",
        });
        setSlots(resp.data?.slots || []);
      } catch (err) {
        console.error("Error cargando disponibilidad:", err);
        setError(
          "No hay horarios disponibles o no se pudo cargar la disponibilidad."
        );
      } finally {
        setLoadingSlots(false);
      }
    };

    loadSlots();
  }, [open, vetId, selectedDate, cita]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!cita || !selectedDate || !selectedHour) return;

    setSaving(true);
    setError("");
    try {
      const dur = cita.duracion || 30;
      const inicio = `${selectedDate}T${selectedHour}`;

      await reprogramarCita(cita.id, {
        inicio,
        duracion: dur,
        box: cita.box || null,
      });

      if (onConfirm) {
        onConfirm({
          id: cita.id,
          nueva_fecha: selectedDate,
          nueva_hora: selectedHour,
        });
      }

      onClose && onClose();
    } catch (err) {
      console.error("Error al reprogramar cita:", err);
      const data = err?.response?.data;
      let msg = "No se pudo reprogramar la cita. Revisa la disponibilidad.";

      if (data) {
        if (typeof data === "string") {
          msg = data;
        } else if (Array.isArray(data.non_field_errors) && data.non_field_errors[0]) {
          msg = data.non_field_errors[0];
        } else if (typeof data.detail === "string") {
          msg = data.detail;
        }
      }

      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  if (!open || !cita) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl border border-slate-200">
        {/* header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Reprogramar cita #{cita.id}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Fecha actual:{" "}
              {dayjs(cita.inicio).format("dddd DD [de] MMMM YYYY · HH:mm")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full hover:bg-slate-100"
          >
            <X className="h-4 w-4 text-slate-500" />
          </button>
        </div>

        {/* body */}
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4 text-sm">
          {/* calendario tipo tira */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
              <CalendarDays className="h-4 w-4 text-sky-600" />
              Selecciona una fecha
            </label>

            <div className="flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => handleWeekNav("prev")}
                className="p-1 rounded-full border border-slate-300 text-slate-600 hover:bg-slate-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <div className="flex flex-col items-center">
                <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide mb-1">
                  {currentMonthLabel}
                </span>
                <div className="flex gap-1 overflow-x-auto pb-1 max-w-xs md:max-w-md">
                  {upcomingDays.map((d) => (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => setSelectedDate(d.value)}
                      className={
                        "flex flex-col items-center min-w-[3rem] px-2 py-1 rounded-lg border text-[11px] " +
                        (selectedDate === d.value
                          ? "bg-sky-600 text-white border-sky-600"
                          : "bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100")
                      }
                    >
                      <span className="uppercase tracking-wide text-[10px]">
                        {d.dow}
                      </span>
                      <span className="text-sm font-semibold">{d.dia}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleWeekNav("next")}
                className="p-1 rounded-full border border-slate-300 text-slate-600 hover:bg-slate-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* horarios disponibles */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1 text-xs font-medium text-slate-700">
              <Clock className="h-3 w-3 text-sky-500" />
              Horarios disponibles
            </label>

            {loadingSlots ? (
              <p className="text-xs text-slate-500">
                Cargando horarios disponibles...
              </p>
            ) : error ? (
              <p className="text-xs text-rose-500">{error}</p>
            ) : slots.length === 0 ? (
              <p className="text-xs text-slate-500">
                No hay horarios disponibles para esta fecha.
              </p>
            ) : (
              <div className="border border-slate-200 rounded-xl bg-slate-50 px-3 py-3">
                <p className="text-[11px] text-slate-500 mb-2">
                  Horarios disponibles para{" "}
                  <span className="font-semibold">
                    {dayjs(selectedDate).format("ddd DD MMM YYYY")}
                  </span>
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                  {slots.map((h) => (
                    <label
                      key={h}
                      className={
                        "flex items-center justify-center rounded-lg border px-2 py-1.5 text-xs cursor-pointer select-none " +
                        (selectedHour === h
                          ? "bg-sky-600 text-white border-sky-600"
                          : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100")
                      }
                    >
                      <input
                        type="radio"
                        name="hora-reprog"
                        value={h}
                        checked={selectedHour === h}
                        onChange={() => setSelectedHour(h)}
                        className="hidden"
                      />
                      {h}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* footer */}
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cerrar
            </button>
            <button
              type="submit"
              disabled={!selectedHour || saving}
              className="rounded-xl bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
            >
              {saving ? "Guardando..." : "Confirmar cambio"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
