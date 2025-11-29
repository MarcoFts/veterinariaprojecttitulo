// src/pages/veterinario/VetAgendaDia.jsx
import { useEffect, useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";
import LayoutVet from "../../components/layout/LayoutVet";
import SlotCard from "../../components/agenda/SlotCard";
import ModalCrearCita from "../../components/modals/ModalCrearCita";
import ModalReprogramarCita from "../../components/modals/ModalReprogramarCita";
// import { getSlotsPorFecha } from "../../services/citas"; // para futuro backend

// Genera un string YYYY-MM-DD de hoy
const todayStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Mock simple de slots
function buildMockSlots() {
  return [
    {
      id: 1,
      horaInicio: "09:00",
      horaFin: "09:30",
      estado: "libre",
      paciente: null,
      mascota: null,
    },
    {
      id: 2,
      horaInicio: "09:30",
      horaFin: "10:00",
      estado: "ocupada",
      paciente: "Juan Pérez",
      mascota: "Firulais",
    },
    {
      id: 3,
      horaInicio: "10:00",
      horaFin: "10:30",
      estado: "libre",
      paciente: null,
      mascota: null,
    },
    {
      id: 4,
      horaInicio: "10:30",
      horaFin: "11:00",
      estado: "cancelada",
      paciente: "María López",
      mascota: "Michi",
    },
  ];
}

export default function VetAgendaDia() {
  const [fecha, setFecha] = useState(todayStr());
  const [slots, setSlots] = useState(buildMockSlots);

  const [slotParaAsignar, setSlotParaAsignar] = useState(null);
  const [citaParaReprogramar, setCitaParaReprogramar] = useState(null);

  // En el futuro, aquí se consumirá getSlotsPorFecha(fecha)
  useEffect(() => {
    // Ejemplo de cómo será:
    // getSlotsPorFecha(fecha).then((res) => setSlots(res.data));
    setSlots(buildMockSlots());
  }, [fecha]);

  const slotsOrdenados = useMemo(() => {
    return [...slots].sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
  }, [slots]);

  const handleAsignarConfirm = (payload) => {
    // Mock: marcamos el slot como "ocupada" localmente
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
    // Mock: solo mostramos efecto local simple (podrías moverlo a otra hora en el futuro)
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
              {slotsOrdenados.map((slot) => (
                <SlotCard
                  key={slot.id}
                  slot={slot}
                  onAsignar={() => setSlotParaAsignar(slot)}
                  onReprogramar={() => setCitaParaReprogramar(slot)}
                  onCancelar={() => handleCancelarSlot(slot.id)}
                />
              ))}
              {slotsOrdenados.length === 0 && (
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
              Más adelante esta vista se conectará en tiempo real con la
              disponibilidad y las reservas del backend.
            </p>
          </div>
        </section>
      </div>

      {/* Modales */}
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
