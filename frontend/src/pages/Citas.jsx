// src/pages/Citas.jsx
import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
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
import { isAuthenticated } from "../auth";

const DURACIONES = [15, 30, 45, 60];

export default function Citas() {
  const [fecha, setFecha] = useState(dayjs().format("YYYY-MM-DD"));
  const [items, setItems] = useState([]);
  const [loadingList, setLoadingList] = useState(false);

  const [form, setForm] = useState({
    cliente: "",       // si vet: selecciona cliente; si dueño: el backend lo ignora
    mascota: "",
    veterinario: "",   // obligatorio para calcular disponibilidad
    box: "BOX-1",
    hora: "10:00",     // se autocompleta al elegir un slot
    duracion: 30,
    motivo: "",
  });

  // contexto/estado
  const [meInfo, setMeInfo] = useState(null);
  const [isVet, setIsVet] = useState(false);

  // catálogos
  const [clientes, setClientes] = useState([]);   // sólo para vet
  const [mascotas, setMascotas] = useState([]);   // lista general (el backend ya filtra para dueño)
  const [vets, setVets] = useState([]);
  const [slots, setSlots] = useState([]);         // horarios disponibles calculados

  const [creating, setCreating] = useState(false);
  const [err, setErr] = useState("");

  // Helpers: fecha/hora → ISO
  const inicioISO = useMemo(() => {
    const [hh, mm] = (form.hora || "10:00").split(":").map(Number);
    return dayjs(fecha).hour(hh).minute(mm).second(0).millisecond(0).toDate().toISOString();
  }, [fecha, form.hora]);

  const finISO = useMemo(() => {
    return dayjs(inicioISO).add(form.duracion || 30, "minute").toDate().toISOString();
  }, [inicioISO, form.duracion]);

  // Cargar perfil + veterinarios + (clientes/mascotas)
  useEffect(() => {
    if (!isAuthenticated()) return;
    (async () => {
      try {
        const [{ data: meData }, { data: vetsData }] = await Promise.all([me(), getVeterinarios()]);
        setMeInfo(meData);
        setIsVet(!!meData?.is_vet);
        setVets(vetsData || []);

        if (meData?.is_vet) {
          // Vet: puede ver todos
          const [{ data: cls }, { data: mascData }] = await Promise.all([getClientes(), getMascotas()]);
          setClientes((cls?.results ?? cls ?? []).map((c) => ({
            id: c.id,
            // si tu serializer de Cliente no trae nombre del user, ajusta la etiqueta aquí
            label: c.user?.email || `Cliente ${c.id}`,
          })));
          setMascotas(mascData?.results ?? mascData ?? []);
        } else {
          // Dueño: backend ya filtra a sus mascotas
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

  // Consultar disponibilidad cuando cambien vet/fecha/duración/box
  useEffect(() => {
    const vetId = form.veterinario || null; // obligatorio para slots
    if (!vetId || !fecha) { setSlots([]); return; }

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
        cliente: isVet ? (form.cliente || null) : null, // si eres dueño, el backend fuerza tu cliente
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
      // limpiar campo motivo; mantenemos la selección actual para seguir agendando
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

  // Mascotas filtradas por cliente cuando el vet elige uno
  const mascotasFiltradas =
    isVet && form.cliente
      ? mascotas.filter((m) => m.cliente === Number(form.cliente) || m.cliente?.id === Number(form.cliente))
      : mascotas;

  return (
    <div className="min-h-[80vh] bg-[#f2fffc]">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Citas</h1>
            <p className="text-slate-600">
              {isVet ? "Agenda y gestiona todas las atenciones." : "Agenda y gestiona tus atenciones."}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-2 bg-white"
            />
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formulario crear */}
          <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow">
            <h2 className="font-semibold text-slate-800 mb-4">Crear nueva cita</h2>
            <form onSubmit={crear} className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Veterinario + Fecha (para disponibilidad) */}
              <div>
                <label className="block text-sm text-slate-600 mb-1">Veterinario</label>
                <select
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white"
                  value={form.veterinario}
                  onChange={(e) => setForm({ ...form, veterinario: e.target.value })}
                >
                  <option value="">Seleccionar…</option>
                  {vets.map(v => <option key={v.id} value={v.id}>{v.nombre}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-600 mb-1">Fecha</label>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white"
                />
              </div>

              {/* Cliente (sólo vet) */}
              {isVet && (
                <div className="md:col-span-2">
                  <label className="block text-sm text-slate-600 mb-1">Cliente</label>
                  <select
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white"
                    value={form.cliente}
                    onChange={(e) => setForm({ ...form, cliente: e.target.value, mascota: "" })}
                  >
                    <option value="">Seleccionar…</option>
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Mascota */}
              <div className="md:col-span-2">
                <label className="block text-sm text-slate-600 mb-1">Mascota</label>
                <select
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white"
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

              {/* Slots disponibles */}
              <div className="md:col-span-2">
                <label className="block text-sm text-slate-600 mb-1">Horarios disponibles</label>
                {!form.veterinario ? (
                  <p className="text-sm text-slate-500">Elige un veterinario para ver horarios.</p>
                ) : slots.length === 0 ? (
                  <p className="text-sm text-slate-500">No hay horarios disponibles para esta selección.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {slots.map((hhmm) => (
                      <button
                        key={hhmm}
                        type="button"
                        onClick={() => setForm({ ...form, hora: hhmm })}
                        className={`px-3 py-1.5 rounded-lg border text-sm ${
                          form.hora === hhmm
                            ? "bg-emerald-500 text-white border-emerald-500"
                            : "border-slate-300 hover:bg-slate-50"
                        }`}
                        title={`Elegir ${hhmm}`}
                      >
                        {hhmm}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Duración / Box */}
              <div>
                <label className="block text-sm text-slate-600 mb-1">Duración</label>
                <select
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white"
                  value={form.duracion}
                  onChange={(e) => setForm({ ...form, duracion: Number(e.target.value) })}
                >
                  {DURACIONES.map((d) => (
                    <option key={d} value={d}>{d} min</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-600 mb-1">Box</label>
                <input
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white"
                  value={form.box}
                  onChange={(e) => setForm({ ...form, box: e.target.value })}
                  placeholder="BOX-1"
                />
              </div>

              {/* Hora editable (por si quiere ajustar manualmente) */}
              <div>
                <label className="block text-sm text-slate-600 mb-1">Hora</label>
                <input
                  type="time"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white"
                  value={form.hora}
                  onChange={(e) => setForm({ ...form, hora: e.target.value })}
                  required
                />
              </div>

              {/* Motivo */}
              <div className="md:col-span-2">
                <label className="block text-sm text-slate-600 mb-1">Motivo</label>
                <input
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white"
                  placeholder="Control, vacunas, urgencia, etc."
                  value={form.motivo}
                  onChange={(e) => setForm({ ...form, motivo: e.target.value })}
                />
              </div>

              {/* Resumen y CTA */}
              <div className="md:col-span-2 flex items-center justify-between text-sm text-slate-600">
                <div>
                  <span className="font-medium">Inicio:</span> {formatLocal(inicioISO)} &nbsp; | &nbsp;
                  <span className="font-medium">Fin:</span> {formatLocal(finISO)}
                </div>
                <button
                  disabled={creating}
                  className={`px-5 py-2 rounded-lg text-white shadow ${
                    creating ? "bg-emerald-300 cursor-not-allowed" : "bg-emerald-500 hover:bg-emerald-600"
                  }`}
                >
                  {creating ? "Creando…" : "Crear cita"}
                </button>
              </div>
            </form>
          </section>

          {/* Listado del día */}
          <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow">
            <h2 className="font-semibold text-slate-800 mb-4">
              Citas del {dayjs(fecha).format("DD MMM YYYY")}
            </h2>
            {loadingList ? (
              <p className="text-sm text-slate-500">Cargando…</p>
            ) : err ? (
              <p className="text-sm text-rose-600">{err}</p>
            ) : items.length === 0 ? (
              <p className="text-sm text-slate-500">No hay citas para esta fecha.</p>
            ) : (
              <ul className="space-y-3">
                {items.map((c) => (
                  <li key={c.id} className="border border-slate-200 rounded-lg p-3 flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="font-medium text-slate-800">
                        {formatLocal(c.inicio)} — {formatLocal(c.fin)}
                        <span
                          className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
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
                      <div className="text-sm text-slate-600 truncate">
                        {c.mascota ? `${c.mascota.nombre ?? ""}${c.mascota.especie ? ` — ${c.mascota.especie}` : ""}` : "Sin mascota"}
                        {c.motivo ? ` · ${c.motivo}` : ""}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {c.estado !== "confirmada" && c.estado !== "cancelada" && (
                        <button
                          onClick={() => onConfirmar(c.id)}
                          className="px-3 py-1.5 rounded-md text-white bg-emerald-500 hover:bg-emerald-600 text-sm"
                        >
                          Confirmar
                        </button>
                      )}
                      {c.estado !== "cancelada" && (
                        <button
                          onClick={() => onCancelar(c.id)}
                          className="px-3 py-1.5 rounded-md text-rose-600 border border-rose-300 hover:bg-rose-50 text-sm"
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
