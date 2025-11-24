import LayoutCliente from "../../components/layout/LayoutCliente";
import { useState } from "react";
import dayjs from "dayjs";
import { CalendarDays, Clock, Stethoscope, PawPrint, User2 } from "lucide-react";

// Opciones de prueba (luego se reemplazan por datos reales del backend)
const DURACIONES = [15, 30, 45, 60];
const BOXES = ["BOX-1", "BOX-2"];
const VETERINARIOS_DEMO = [
  { id: 1, nombre: "Dr. Pérez" },
  { id: 2, nombre: "Dra. González" },
];
const MASCOTAS_DEMO = [
  { id: 1, nombre: "Luna" },
  { id: 2, nombre: "Rocky" },
];

export default function Citas() {
  const [fecha, setFecha] = useState(dayjs().format("YYYY-MM-DD"));
  const [form, setForm] = useState({
    veterinario: "",
    mascota: "",
    duracion: 30,
    box: "BOX-1",
    hora: "10:00",
    motivo: "",
  });

  const [citasDia, setCitasDia] = useState([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    // Validación súper básica front
    if (!form.veterinario || !form.mascota || !form.motivo) {
      setError("Completa los campos obligatorios para crear la cita.");
      return;
    }

    setCreating(true);

    // TODO: conectar con el backend (Django + DRF)
    // Aquí se haría el POST real a /api/citas/
    setTimeout(() => {
      const nuevaCita = {
        id: Date.now(),
        ...form,
        fecha,
      };
      setCitasDia((prev) => [...prev, nuevaCita]);
      setCreating(false);
    }, 500);
  };

  return (
    <LayoutCliente>
      <div className="space-y-8">
        {/* Encabezado */}
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.25em] text-sky-600 uppercase mb-1">
              VetCare · Cliente
            </p>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                <CalendarDays size={20} />
              </span>
              <span>Citas</span>
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Agenda y gestiona tus atenciones en la clínica veterinaria.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 bg-white/70 backdrop-blur-md rounded-full px-3 py-1 shadow-sm border border-slate-100">
              <User2 size={14} className="text-sky-600" />
              <span>Estos datos se conectarán al backend en el futuro.</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 hidden md:inline">
                Selecciona fecha para ver las citas del día.
              </span>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="border border-slate-200 rounded-xl px-3 py-2 bg-white/80 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
              />
            </div>
          </div>
        </header>

        {/* Contenido principal */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formulario */}
          <section className="bg-white/60 backdrop-blur-md border border-white/60 rounded-2xl p-5 md:p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                  <Stethoscope size={18} className="text-sky-600" />
                  Crear nueva cita
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Completa los datos para agendar una nueva atención.
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-3 rounded-xl bg-rose-50 border border-rose-100 px-3 py-2 text-xs text-rose-600">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              {/* Fila 1: Vet / Fecha */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-600 flex items-center gap-1">
                    <Stethoscope size={14} className="text-sky-500" />
                    Veterinario
                  </label>
                  <select
                    name="veterinario"
                    value={form.veterinario}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
                  >
                    <option value="">Seleccionar…</option>
                    {VETERINARIOS_DEMO.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-600 flex items-center gap-1">
                    <CalendarDays size={14} className="text-sky-500" />
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
                  />
                </div>
              </div>

              {/* Fila 2: Mascota */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600 flex items-center gap-1">
                  <PawPrint size={14} className="text-sky-500" />
                  Mascota
                </label>
                <select
                  name="mascota"
                  value={form.mascota}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
                >
                  <option value="">Seleccionar…</option>
                  {MASCOTAS_DEMO.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Fila 3: Duración / Box */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-600">
                    Duración
                  </label>
                  <select
                    name="duracion"
                    value={form.duracion}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
                  >
                    {DURACIONES.map((d) => (
                      <option key={d} value={d}>
                        {d} min
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-600">
                    Box
                  </label>
                  <select
                    name="box"
                    value={form.box}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
                  >
                    {BOXES.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Fila 4: Hora */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600">
                  Hora
                </label>
                <input
                  type="time"
                  name="hora"
                  value={form.hora}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
                />
              </div>

              {/* Fila 5: Motivo */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600">
                  Motivo de la consulta
                </label>
                <input
                  type="text"
                  name="motivo"
                  value={form.motivo}
                  onChange={handleChange}
                  placeholder="Control, vacunas, urgencia, etc."
                  className="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
                />
              </div>

              {/* Acción */}
              <div className="flex items-center justify-between pt-1">
                <p className="text-[11px] text-slate-400">
                  *Las citas se conectarán al backend de VetCare en el futuro.
                </p>
                <button
                  type="submit"
                  disabled={creating}
                  className={`inline-flex items-center justify-center rounded-xl px-5 py-2 text-sm font-semibold text-white shadow-md transition ${
                    creating
                      ? "bg-sky-300/80 cursor-not-allowed"
                      : "bg-gradient-to-r from-sky-500 to-blue-600 hover:opacity-90 hover:shadow-lg"
                  }`}
                >
                  {creating ? "Creando…" : "Crear cita"}
                </button>
              </div>
            </form>
          </section>

          {/* Listado del día */}
          <section className="bg-white/60 backdrop-blur-md border border-white/60 rounded-2xl p-5 md:p-6 shadow-xl">
            <h2 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
              <Clock size={18} className="text-sky-600" />
              Citas del {dayjs(fecha).format("DD MMM YYYY")}
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Visualiza las atenciones agendadas para la fecha seleccionada.
            </p>

            {citasDia.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-white/60 px-4 py-6 text-sm text-slate-500">
                No hay citas registradas para esta fecha. <br />
                Estas se mostrarán aquí cuando el backend esté conectado.
              </div>
            ) : (
              <ul className="space-y-3 text-sm">
                {citasDia.map((cita) => (
                  <li
                    key={cita.id}
                    className="rounded-xl border border-slate-100 bg-white/80 px-3 py-3 shadow-sm flex justify-between items-center gap-3"
                  >
                    <div>
                      <p className="font-medium text-slate-800">
                        {cita.hora} · {cita.motivo || "Consulta"}
                      </p>
                      <p className="text-xs text-slate-500">
                        Duración: {cita.duracion} min · Box: {cita.box}
                      </p>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-sky-100 text-sky-700 text-[11px] px-2 py-1">
                      Pendiente
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </LayoutCliente>
  );
}
