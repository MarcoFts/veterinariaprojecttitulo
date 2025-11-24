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

import {
  me,
  getCitas,
  crearCita as apiCrearCita,
  confirmarCita as apiConfirmarCita,
  cancelarCita as apiCancelarCita,
  getMascotas,
  getClientes,
  getVeterinarios,
  getDisponibilidad,
} from "../../services/api";
import { isAuthenticated } from "../../auth";

const DURACIONES = [15, 30, 45, 60];

export default function Citas() {
  const [fecha, setFecha] = useState(dayjs().format("YYYY-MM-DD"));
  const [items, setItems] = useState([]);
  const [loadingList, setLoadingList] = useState(false);

  const [form, setForm] = useState({
    cliente: "",
    mascota: "",
    veterinario: "",
    box: "BOX-1",
    hora: "10:00",
    duracion: 30,
    motivo: "",
  });

  const [meInfo, setMeInfo] = useState(null);
  const [isVet, setIsVet] = useState(false);

  const [clientes, setClientes] = useState([]);
  const [mascotas, setMascotas] = useState([]);
  const [vets, setVets] = useState([]);
  const [slots, setSlots] = useState([]);

  const [creating, setCreating] = useState(false);
  const [err, setErr] = useState("");

  // Helpers fecha / hora
  const inicioISO = useMemo(() => {
    const [hh, mm] = (form.hora || "10:00").split(":").map(Number);
    return dayjs(fecha)
      .hour(hh)
      .minute(mm)
      .second(0)
      .millisecond(0)
      .toDate()
      .toISOString();
  }, [fecha, form.hora]);

  const finISO = useMemo(
    () => dayjs(inicioISO).add(form.duracion || 30, "minute").toDate().toISOString(),
    [inicioISO, form.duracion]
  );

  // Perfil + catálogos
  useEffect(() => {
    if (!isAuthenticated()) return;

    (async () => {
      try {
        const [{ data: meData }, { data: vetsData }] = await Promise.all([
          me(),
          getVeterinarios(),
        ]);
        setMeInfo(meData);
        setIsVet(!!meData?.is_vet);
        setVets(vetsData || []);

        if (meData?.is_vet) {
          const [{ data: cls }, { data: mascData }] = await Promise.all([
            getClientes(),
            getMascotas(),
          ]);

          setClientes((cls?.results ?? cls ?? []).map((c) => ({
            id: c.id,
            label: c.user?.email || `Cliente ${c.id}`,
          })));

          setMascotas(mascData?.results ?? mascData ?? []);
        } else {
          const { data: mascData } = await getMascotas();
          setMascotas(mascData?.results ?? mascData ?? []);
        }
      } catch (e) {
        console.warn("No se pudo cargar perfil/catalogos", e);
      }
    })();
  }, []);

  // Cargar citas del día
  useEffect(() => {
    (async () => {
      setLoadingList(true);
      setErr("");
      try {
        const { data } = await getCitas({ fecha });
        setItems(data?.results || data || []);
      } catch (e) {
        setErr("No se pudo cargar las citas de este día.");
      } finally {
        setLoadingList(false);
      }
    })();
  }, [fecha]);

  // Slots disponibles
  useEffect(() => {
    const vetId = form.veterinario || null;
    if (!vetId || !fecha) {
      setSlots([]);
      return;
    }

    (async () => {
      try {
        const { data } = await getDisponibilidad({
          veterinario_id: vetId,
          fecha,
          duracion: form.duracion,
          box: form.box || "",
        });
        setSlots(data?.slots || []);
      } catch {
        setSlots([]);
      }
    })();
  }, [form.veterinario, form.duracion, form.box, fecha]);

  // Crear cita
  const crear = async (e) => {
    e.preventDefault();
    if (!form.veterinario) {
      alert("Selecciona un veterinario.");
      return;
    }
    if (!form.mascota) {
      alert("Selecciona una mascota.");
      return;
    }

    setCreating(true);
    setErr("");

    try {
      const payload = {
        cliente: isVet ? form.cliente || null : null,
        mascota: form.mascota,
        veterinario: form.veterinario,
        box: form.box || "BOX-1",
        inicio: inicioISO,
        fin: finISO,
        motivo: form.motivo?.trim() || "",
      };

      await apiCrearCita(payload);
      const resp = await getCitas({ fecha });
      setItems(resp.data?.results || resp.data || []);
      setForm((f) => ({ ...f, motivo: "" }));
    } catch (e) {
      const msg = e?.response?.data || e.message || "No se pudo crear la cita.";
      alert(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setCreating(false);
    }
  };

  // Acciones sobre cita
  const onConfirmar = async (id) => {
    try {
      await apiConfirmarCita(id);
      const resp = await getCitas({ fecha });
      setItems(resp.data?.results || resp.data || []);
    } catch {
      alert("No se pudo confirmar la cita.");
    }
  };

  const onCancelar = async (id) => {
    try {
      await apiCancelarCita(id);
      const resp = await getCitas({ fecha });
      setItems(resp.data?.results || resp.data || []);
    } catch {
      alert("No se pudo cancelar la cita.");
    }
  };

  const mascotasFiltradas =
    isVet && form.cliente
      ? mascotas.filter(
          (m) =>
            m.cliente === Number(form.cliente) ||
            m.cliente?.id === Number(form.cliente)
        )
      : mascotas;

  return (
    <LayoutCliente>
    <div className="min-h-[80vh] bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
        {/* Encabezado */}
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
          <div>
            <p className="text-xs font-semibold tracking-[0.25em] text-sky-600 uppercase mb-1">
              VetCare · {isVet ? "Veterinario" : "Cliente"}
            </p>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                <CalendarDays size={20} />
              </span>
              <span>Citas</span>
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              {isVet
                ? "Agenda y gestiona todas las atenciones de la clínica."
                : "Agenda y gestiona tus atenciones en la clínica veterinaria."}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 bg-white rounded-xl px-3 py-2 shadow-sm border border-slate-100">
              <Clock size={16} className="text-sky-500" />
              <span>Selecciona fecha para ver las citas del día.</span>
            </div>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-2 bg-white text-sm shadow-sm"
            />
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formulario */}
          <section className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm">
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

              {meInfo && (
                <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 bg-slate-50 rounded-full px-3 py-1">
                  <User2 size={14} className="text-slate-600" />
                  <span>
                    Sesión: {isVet ? "Profesional" : "Cliente"}
                  </span>
                </div>
              )}
            </div>

            <form onSubmit={crear} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Vet + Fecha */}
              <div>
                <label className="block text-sm text-slate-600 mb-1">Veterinario</label>
                <select
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                  value={form.veterinario}
                  onChange={(e) => setForm({ ...form, veterinario: e.target.value })}
                >
                  <option value="">Seleccionar…</option>
                  {vets.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-600 mb-1">Fecha</label>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                />
              </div>

              {/* Cliente (solo vet) */}
              {isVet && (
                <div className="md:col-span-2">
                  <label className="block text-sm text-slate-600 mb-1">Cliente</label>
                  <select
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                    value={form.cliente}
                    onChange={(e) =>
                      setForm({ ...form, cliente: e.target.value, mascota: "" })
                    }
                  >
                    <option value="">Seleccionar…</option>
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Mascota */}
              <div className="md:col-span-2">
                <label className="block text-sm text-slate-600 mb-1 flex items-center gap-1.5">
                  <PawPrint size={15} className="text-sky-600" />
                  Mascota
                </label>
                <select
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                  value={form.mascota}
                  onChange={(e) => setForm({ ...form, mascota: e.target.value })}
                >
                  <option value="">Seleccionar…</option>
                  {mascotasFiltradas.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nombre} — {m.especie}
                    </option>
                  ))}
                </select>
              </div>

              {/* Slots */}
              <div className="md:col-span-2">
                <label className="block text-sm text-slate-600 mb-1">
                  Horarios disponibles
                </label>
                {!form.veterinario ? (
                  <p className="text-sm text-slate-500">
                    Elige un veterinario para ver horarios disponibles.
                  </p>
                ) : slots.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    No hay horarios disponibles para esta selección.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {slots.map((hhmm) => (
                      <button
                        key={hhmm}
                        type="button"
                        onClick={() => setForm({ ...form, hora: hhmm })}
                        className={`px-3 py-1.5 rounded-lg border text-xs md:text-sm ${
                          form.hora === hhmm
                            ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                            : "border-slate-300 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {hhmm}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Duración / Box / Hora */}
              <div>
                <label className="block text-sm text-slate-600 mb-1">Duración</label>
                <select
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                  value={form.duracion}
                  onChange={(e) =>
                    setForm({ ...form, duracion: Number(e.target.value) })
                  }
                >
                  {DURACIONES.map((d) => (
                    <option key={d} value={d}>
                      {d} min
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-600 mb-1">Box</label>
                <input
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                  value={form.box}
                  onChange={(e) => setForm({ ...form, box: e.target.value })}
                  placeholder="BOX-1"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-600 mb-1">Hora</label>
                <input
                  type="time"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                  value={form.hora}
                  onChange={(e) => setForm({ ...form, hora: e.target.value })}
                  required
                />
              </div>

              {/* Motivo */}
              <div className="md:col-span-2">
                <label className="block text-sm text-slate-600 mb-1">
                  Motivo de la consulta
                </label>
                <input
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                  placeholder="Control, vacunas, urgencia, etc."
                  value={form.motivo}
                  onChange={(e) => setForm({ ...form, motivo: e.target.value })}
                />
              </div>

              {/* Resumen + CTA */}
              <div className="md:col-span-2 flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-xs md:text-sm text-slate-600 mt-1">
                <div>
                  <span className="font-medium">Inicio:</span> {formatLocal(inicioISO)}{" "}
                  · <span className="font-medium">Fin:</span> {formatLocal(finISO)}
                </div>
                <button
                  disabled={creating}
                  className={`inline-flex items-center justify-center rounded-xl px-5 py-2 text-sm font-semibold text-white shadow-md transition ${
                    creating
                      ? "bg-emerald-300 cursor-not-allowed"
                      : "bg-emerald-500 hover:bg-emerald-600 hover:shadow-lg"
                  }`}
                >
                  {creating ? "Creando…" : "Crear cita"}
                </button>
              </div>
            </form>
          </section>

          {/* Listado del día */}
          <section className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm">
            <h2 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
              <Clock size={18} className="text-sky-600" />
              Citas del {dayjs(fecha).format("DD MMM YYYY")}
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Visualiza las atenciones agendadas para la fecha seleccionada.
            </p>

            {loadingList ? (
              <p className="text-sm text-slate-500">Cargando citas…</p>
            ) : err ? (
              <p className="text-sm text-rose-600">{err}</p>
            ) : items.length === 0 ? (
              <p className="text-sm text-slate-500">
                No hay citas registradas para esta fecha.
              </p>
            ) : (
              <ul className="space-y-3">
                {items.map((c) => (
                  <li
                    key={c.id}
                    className="border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="font-medium text-slate-800 flex items-center gap-2">
                        {formatLocal(c.inicio)} — {formatLocal(c.fin)}
                        <span
                          className={`ml-1 text-[11px] px-2 py-0.5 rounded-full capitalize ${
                            c.estado === "confirmada"
                              ? "bg-emerald-100 text-emerald-700"
                              : c.estado === "cancelada"
                              ? "bg-rose-100 text-rose-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {c.estado}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 truncate mt-0.5">
                        {c.mascota
                          ? `${c.mascota.nombre ?? ""}${
                              c.mascota.especie ? ` · ${c.mascota.especie}` : ""
                            }`
                          : "Sin mascota asociada"}
                        {c.motivo ? ` · ${c.motivo}` : ""}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {c.estado !== "confirmada" && c.estado !== "cancelada" && (
                        <button
                          onClick={() => onConfirmar(c.id)}
                          className="px-3 py-1.5 rounded-md text-xs text-white bg-emerald-500 hover:bg-emerald-600"
                        >
                          Confirmar
                        </button>
                      )}
                      {c.estado !== "cancelada" && (
                        <button
                          onClick={() => onCancelar(c.id)}
                          className="px-3 py-1.5 rounded-md text-xs text-rose-600 border border-rose-300 hover:bg-rose-50"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
    </LayoutCliente>
  );
}

/* -------- utils -------- */
function formatLocal(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}
