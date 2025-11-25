import LayoutCliente from "../../components/layout/LayoutCliente";
import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import {
  CalendarDays,
  Clock,
  Stethoscope,
  PawPrint,
  User2,
} from "lucide-react";
import api, { getVeterinarios, getMascotas, getCitas, crearCita } from "../../services/api";

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // cargar datos de backend
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
          setError("Tu sesión expiró. Vuelve a iniciar sesión.");
        } else {
          setError("No se pudo cargar la información del servidor.");
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
      // backend devuelve la cita creada
      setCitasDia((prev) => [...prev, resp.data]);
      setForm((prev) => ({ ...prev, motivo: "" }));
    } catch (err) {
      if (err?.response?.status === 401) {
        setError("No autorizado. Inicia sesión otra vez.");
      } else {
        setError("No se pudo crear la cita. Revisa los datos.");
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <LayoutCliente>
      <div className="space-y-8">
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
        </header>

        {error && (
          <div className="rounded-xl bg-rose-50 border border-rose-100 px-3 py-2 text-xs text-rose-600">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formulario */}
          <section className="bg-white/60 backdrop-blur-md border border-white/60 rounded-2xl p-5 md:p-6 shadow-xl">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2 mb-4">
              <Stethoscope size={18} className="text-sky-600" />
              Crear nueva cita
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-600 flex items-center gap-1">
                    <Stethoscope size={14} className="text-sky-500" />
                    Veterinario
                  </label>
                  <select
                    name="veterinario_id"
                    value={form.veterinario_id}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
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
                    className="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600 flex items-center gap-1">
                  <PawPrint size={14} className="text-sky-500" />
                  Mascota
                </label>
                <select
                  name="mascota_id"
                  value={form.mascota_id}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
                >
                  <option value="">Seleccionar…</option>
                  {mascotas.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nombre}
                    </option>
                  ))}
                </select>
              </div>

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

              <div className="flex items-center justify-between pt-1">
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

          {/* Listado */}
          <section className="bg-white/60 backdrop-blur-md border border-white/60 rounded-2xl p-5 md:p-6 shadow-xl">
            <h2 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
              <Clock size={18} className="text-sky-600" />
              Citas del {dayjs(fecha).format("DD MMM YYYY")}
            </h2>

            {loading ? (
              <p className="text-sm text-slate-500">Cargando citas…</p>
            ) : citasDia.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-white/60 px-4 py-6 text-sm text-slate-500">
                No hay citas registradas para esta fecha.
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
                        {dayjs(cita.inicio).format("HH:mm")} · {cita.motivo || "Consulta"}
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
