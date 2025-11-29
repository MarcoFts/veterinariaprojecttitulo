import LayoutCliente from "../../components/layout/LayoutCliente";
import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import {
  CalendarDays,
  Clock,
  Stethoscope,
  PawPrint,
  Info,
} from "lucide-react";
import {
  getVeterinarios,
  getMascotas,
  getCitas,
  crearCita,
} from "../../services/api";

const DURACIONES = [15, 30, 45, 60];
const BOXES = ["BOX-1", "BOX-2"];

export default function Citas() {
  const [fecha, setFecha] = useState(dayjs().format("YYYY-MM-DD"));

  const [form, setForm] = useState({
    veterinario_id: "",
    mascota_id: "",
    duracion: 30,
    box: "BOX-1",
    hora: "10:00",
    motivo: "",
  });

  const [veterinarios, setVeterinarios] = useState([]);
  const [mascotas, setMascotas] = useState([]);
  const [citasDia, setCitasDia] = useState([]);

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  // ordenar citas por hora para mostrar lista limpia
  const citasOrdenadas = useMemo(
    () =>
      [...citasDia].sort((a, b) =>
        dayjs(a.inicio).diff(dayjs(b.inicio))
      ),
    [citasDia]
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // cargar datos desde backend (cuando esté disponible)
  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      setError("");
      try {
        const [vetsResp, petsResp, citasResp] = await Promise.all([
          getVeterinarios(),
          getMascotas(),
          getCitas({ fecha }),
        ]);

        setVeterinarios(vetsResp.data || []);
        setMascotas(petsResp.data || []);
        setCitasDia(citasResp.data || []);
      } catch (err) {
        if (err?.response?.status === 401) {
          setError("Tu sesión expiró. Vuelve a iniciar sesión cuando el backend esté activo.");
        } else {
          setError("No se pudo cargar la información del servidor en este momento.");
        }
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, [fecha]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.veterinario_id || !form.mascota_id || !form.motivo) {
      setError("Completa los campos obligatorios para crear la cita.");
      return;
    }

    setCreating(true);
    try {
      const inicio = dayjs(`${fecha} ${form.hora}`);
      const fin = inicio.add(Number(form.duracion), "minute");

      const payload = {
        veterinario: Number(form.veterinario_id),
        mascota: Number(form.mascota_id),
        box: form.box,
        motivo: form.motivo,
        inicio: inicio.toISOString(),
        fin: fin.toISOString(),
      };

      const resp = await crearCita(payload);
      setCitasDia((prev) => [...prev, resp.data]);
      setForm((prev) => ({ ...prev, motivo: "" }));
    } catch (err) {
      if (err?.response?.status === 401) {
        setError("No autorizado. Inicia sesión otra vez cuando el backend esté disponible.");
      } else {
        setError("No se pudo crear la cita. Revisa los datos ingresados.");
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <LayoutCliente>
      <div className="space-y-8">
        {/* ENCABEZADO SUPERIOR */}
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.25em] text-sky-600 uppercase mb-1">
              Vetyon · Cliente
            </p>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                <CalendarDays size={20} />
              </span>
              <span>Citas</span>
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Agenda, organiza y revisa las atenciones de tus mascotas en la clínica.
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <span className="text-[11px] text-slate-500 hidden md:inline">
              Selecciona una fecha para ver y crear citas ese día.
            </span>
            <div className="inline-flex items-center gap-2 rounded-2xl bg-white/80 border border-slate-200 px-3 py-2 shadow-sm">
              <CalendarDays className="h-4 w-4 text-sky-500" />
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="border-none bg-transparent text-sm text-slate-700 focus:outline-none focus:ring-0"
              />
            </div>
          </div>
        </header>

        {/* ALERTA DE ERROR */}
        {error && (
          <div className="rounded-xl bg-rose-50 border border-rose-100 px-3 py-2 text-xs text-rose-600 flex items-start gap-2">
            <Info className="h-4 w-4 mt-[2px]" />
            <span>{error}</span>
          </div>
        )}

        {/* CONTENIDO PRINCIPAL */}
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-6">
          {/* PANEL IZQUIERDO: FORMULARIO */}
          <section className="bg-gradient-to-br from-sky-50/80 via-white to-white border border-white/80 rounded-2xl p-5 md:p-6 shadow-xl space-y-5">
            {/* Encabezado pequeño del formulario */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-sky-600">
                  <Stethoscope size={18} />
                </span>
                <div>
                  <h2 className="font-semibold text-slate-900 text-sm md:text-base">
                    Crear nueva cita
                  </h2>
                  <p className="text-xs text-slate-500">
                    Completa los datos para agendar una atención en la clínica.
                  </p>
                </div>
              </div>
              <div className="hidden md:flex flex-col items-end text-[11px] text-slate-500">
                <span>Duración: {form.duracion} min · Box: {form.box}</span>
                <span>Hora seleccionada: {form.hora}</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              {/* VETERINARIO + FECHA */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-600 flex items-center gap-1">
                    <Stethoscope size={14} className="text-sky-500" />
                    Veterinario
                    <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="veterinario_id"
                    value={form.veterinario_id}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 bg-white/90 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
                  >
                    <option value="">Seleccionar…</option>
                    {veterinarios.map((v) => (
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
                    className="w-full rounded-xl border border-slate-200 bg-white/90 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
                  />
                </div>
              </div>

              {/* MASCOTA */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600 flex items-center gap-1">
                  <PawPrint size={14} className="text-sky-500" />
                  Mascota
                  <span className="text-rose-500">*</span>
                </label>
                <select
                  name="mascota_id"
                  value={form.mascota_id}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-white/90 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
                >
                  <option value="">Seleccionar…</option>
                  {mascotas.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* DURACIÓN + BOX */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-600">
                    Duración
                  </label>
                  <select
                    name="duracion"
                    value={form.duracion}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 bg-white/90 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
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
                    className="w-full rounded-xl border border-slate-200 bg-white/90 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
                  >
                    {BOXES.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* HORA */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600">
                  Hora
                </label>
                <input
                  type="time"
                  name="hora"
                  value={form.hora}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-white/90 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
                />
              </div>

              {/* MOTIVO */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600 flex items-center gap-1">
                  Motivo de la consulta
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="motivo"
                  value={form.motivo}
                  onChange={handleChange}
                  placeholder="Control, vacunas, urgencia, etc."
                  className="w-full rounded-xl border border-slate-200 bg-white/90 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
                />
              </div>

              {/* BOTÓN SUBMIT + INFO */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 pt-1">
                <p className="text-[11px] text-slate-400 max-w-xs">
                  Las citas se registrarán en tu panel y se conectarán al backend
                  de Vetyon en el futuro.
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

          {/* PANEL DERECHO: LISTA DE CITAS */}
          <section className="bg-white/70 backdrop-blur-md border border-white/80 rounded-2xl p-5 md:p-6 shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-sky-600">
                  <Clock size={18} />
                </span>
                <div>
                  <h2 className="font-semibold text-slate-900 text-sm md:text-base">
                    Citas del {dayjs(fecha).format("DD MMM YYYY")}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Visualiza las atenciones programadas para este día.
                  </p>
                </div>
              </div>

              <span className="rounded-full bg-sky-50 text-sky-700 text-[11px] font-medium px-3 py-1 border border-sky-100">
                {citasOrdenadas.length} cita
                {citasOrdenadas.length === 1 ? "" : "s"}
              </span>
            </div>

            {loading ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-white/70 px-4 py-6 text-sm text-slate-500">
                Cargando citas…
              </div>
            ) : citasOrdenadas.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-white/70 px-4 py-6 text-sm text-slate-500">
                No hay citas registradas para esta fecha. Crea una nueva cita en el panel izquierdo.
              </div>
            ) : (
              <ul className="space-y-3 text-sm">
                {citasOrdenadas.map((cita) => (
                  <li
                    key={cita.id}
                    className="rounded-xl border border-slate-100 bg-white/90 px-3 py-3 shadow-sm flex justify-between items-center gap-3"
                  >
                    <div>
                      <p className="font-medium text-slate-800">
                        {dayjs(cita.inicio).format("HH:mm")} ·{" "}
                        {cita.motivo || "Consulta"}
                      </p>
                      <p className="text-xs text-slate-500">
                        Box: {cita.box}
                      </p>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-sky-100 text-sky-700 text-[11px] px-2 py-1">
                      {cita.estado || "Pendiente"}
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
