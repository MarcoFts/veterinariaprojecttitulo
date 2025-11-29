// src/pages/veterinario/VetAgendaDia.jsx
import { useEffect, useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";
import LayoutVet from "../../components/layout/LayoutVet";
import SlotCard from "../../components/agenda/SlotCard";
import ModalCrearCita from "../../components/modals/ModalCrearCita";
import ModalReprogramarCita from "../../components/modals/ModalReprogramarCita";
import {
  me as getUserProfile,
  getDisponibilidad,
  getCitas,
} from "../../services/api";

// Genera un string YYYY-MM-DD de hoy
const todayStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// suma minutos a "HH:MM" y devuelve "HH:MM"
const sumarMinutos = (horaStr, minutos) => {
  const [h, m] = horaStr.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m + minutos, 0, 0);
  return d.toTimeString().slice(0, 5);
};

export default function VetAgendaDia() {
  const [fecha, setFecha] = useState(todayStr());
  const [slots, setSlots] = useState([]);

  const [slotParaAsignar, setSlotParaAsignar] = useState(null);
  const [citaParaReprogramar, setCitaParaReprogramar] = useState(null);

  const [vetId, setVetId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 1) Obtener info del usuario para saber el id del veterinario
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await getUserProfile();
        if (res.data?.id) {
          setVetId(res.data.id);
        }
      } catch (err) {
        console.error("Error obteniendo perfil:", err);
        setError("No se pudo obtener la información del veterinario.");
      }
    };
    fetchUser();
  }, []);

  // 2) Cargar agenda del día desde el backend (disponibilidad + citas)
  useEffect(() => {
    if (!vetId) return;

    const fetchAgendaDia = async () => {
      setLoading(true);
      setError("");
      try {
        const [dispRes, citasRes] = await Promise.all([
          getDisponibilidad({
            veterinario_id: vetId,
            fecha,
            duracion: 30, // mismo tamaño de bloque que en backend
            box: "BOX-1",
          }),
          getCitas({ fecha }),
        ]);

        const libres = dispRes?.data?.slots || [];

        const rawCitas = Array.isArray(citasRes.data)
          ? citasRes.data
          : Array.isArray(citasRes.data?.results)
          ? citasRes.data.results
          : [];

        const citas = rawCitas.map((c) => {
          const d = new Date(c.inicio);
          const horaInicio = d.toTimeString().slice(0, 5);
          return {
            ...c,
            horaInicio,
            horaFin: sumarMinutos(horaInicio, 30),
          };
        });

        // Unir horas libres + horas de citas (ocupadas o canceladas)
        const horasSet = new Set();
        libres.forEach((h) => horasSet.add(h));
        citas.forEach((c) => horasSet.add(c.horaInicio));
        const horasOrdenadas = Array.from(horasSet).sort();

        const nuevosSlots = horasOrdenadas.map((hora, idx) => {
          const cita = citas.find((c) => c.horaInicio === hora);

          if (cita) {
            const estado = cita.estado === "cancelada" ? "cancelada" : "ocupada";
            const paciente =
              cita.cliente_nombre ||
              cita.cliente?.nombre_completo ||
              cita.cliente?.nombre ||
              null;
            const mascotaNombre =
              cita.mascota_nombre || cita.mascota?.nombre || null;

            return {
              id: cita.id || idx + 1,
              horaInicio: hora,
              horaFin: sumarMinutos(hora, 30),
              estado,
              paciente,
              mascota: mascotaNombre,
              citaId: cita.id,
            };
          }

          // Slot libre (viene solo desde /agenda/disponibilidad/)
          return {
            id: `libre-${idx}`,
            horaInicio: hora,
            horaFin: sumarMinutos(hora, 30),
            estado: "libre",
            paciente: null,
            mascota: null,
            citaId: null,
          };
        });

        setSlots(nuevosSlots);
      } catch (err) {
        console.error("Error cargando agenda del día:", err);
        setError("No se pudo cargar la agenda para esa fecha.");
        setSlots([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAgendaDia();
  }, [fecha, vetId]);

  const slotsOrdenados = useMemo(() => {
    return [...slots].sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
  }, [slots]);

  // ---- Acciones (por ahora siguen siendo locales/mock) ----
  const handleAsignarConfirm = (payload) => {
    // TODO: aquí se puede llamar a crearCita(payload) contra el backend
    setSlots((prev) =>
      prev.map((s) =>
        s.id === payload.slot_id
          ? {
              ...s,
              estado: "ocupada",
              paciente: "Cliente mock",
              mascota: "Mascota mock",
            }
          : s
      )
    );
  };

  const handleReprogramarConfirm = (payload) => {
    // TODO: aquí se puede llamar a reprogramarCita(payload) contra el backend
    setSlots((prev) =>
      prev.map((s) =>
        s.id === payload.id
          ? {
              ...s,
              horaInicio: payload.nueva_hora,
              horaFin: payload.nueva_hora, // solo demostrativo
            }
          : s
      )
    );
  };

  const handleCancelarSlot = (slotId) => {
    // TODO: aquí se puede llamar a cancelarCita(slotId) contra el backend
    setSlots((prev) =>
      prev.map((s) =>
        s.id === slotId ? { ...s, estado: "cancelada" } : s
      )
    );
  };

  return (
    <LayoutVet>
      <div className="space-y-8">
        {/* Encabezado */}
        <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-sky-600 uppercase">
              Vetyon · Veterinario
            </p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">
              Agenda del día
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Revisa tus horas disponibles, ocupadas y canceladas para la fecha
              seleccionada.
            </p>
            {error && (
              <p className="mt-2 text-xs text-rose-500">
                {error}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
              <CalendarDays size={18} className="text-sky-600" />
              <input
                type="date"
                className="border-0 bg-transparent text-sm text-slate-800 outline-none"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* Contenido principal */}
        <section className="grid grid-cols-1 lg:grid-cols-[1.4fr,1fr] gap-6">
          {/* Columna izquierda: Slots */}
          <div className="rounded-2xl bg-white shadow-sm border border-slate-100 p-4 md:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Horas del día
                </p>
                <p className="text-xs text-slate-500">
                  Basadas en tu disponibilidad recurrente.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {loading && (
                <p className="text-xs text-slate-500">
                  Cargando agenda del día...
                </p>
              )}

              {!loading &&
                slotsOrdenados.map((slot) => (
                  <SlotCard
                    key={slot.id}
                    slot={slot}
                    onAsignar={() => setSlotParaAsignar(slot)}
                    onReprogramar={() => setCitaParaReprogramar(slot)}
                    onCancelar={() => handleCancelarSlot(slot.id)}
                  />
                ))}

              {!loading && slotsOrdenados.length === 0 && (
                <p className="text-xs text-slate-500">
                  No hay horas generadas para esta fecha.
                </p>
              )}
            </div>
          </div>

          {/* Columna derecha: Resumen */}
          <div className="rounded-2xl bg-white shadow-sm border border-slate-100 p-4 md:p-5 space-y-4">
            <p className="text-sm font-semibold text-slate-900">
              Resumen del día
            </p>
            <ul className="space-y-2 text-xs text-slate-600">
              <li>
                • Horas libres:{" "}
                {slots.filter((s) => s.estado === "libre").length}
              </li>
              <li>
                • Horas ocupadas:{" "}
                {slots.filter((s) => s.estado === "ocupada").length}
              </li>
              <li>
                • Horas canceladas:{" "}
                {slots.filter((s) => s.estado === "cancelada").length}
              </li>
            </ul>
            <p className="text-[11px] text-slate-400">
              Esta vista se alimenta de tus horarios, bloqueos y citas
              almacenadas en el backend.
            </p>
          </div>
        </section>
      </div>

      {/* Modales (por ahora siguen trabajando en local/mock) */}
      <ModalCrearCita
        open={!!slotParaAsignar}
        slot={slotParaAsignar}
        onClose={() => setSlotParaAsignar(null)}
        onConfirm={handleAsignarConfirm}
      />

      <ModalReprogramarCita
        open={!!citaParaReprogramar}
        cita={citaParaReprogramar}
        onClose={() => setCitaParaReprogramar(null)}
        onConfirm={handleReprogramarConfirm}
      />
    </LayoutVet>
  );
}
