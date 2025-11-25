import { useEffect, useMemo, useState } from "react";
import LayoutVet from "../../components/layout/LayoutVet";
import api from "../../services/api";
import { logout } from "../../auth";

const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export default function VetAgenda() {
  const hoyISO = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [fecha, setFecha] = useState(hoyISO);

  const [horarios, setHorarios] = useState([]);   // todos los horarios del vet
  const [bloquesDia, setBloquesDia] = useState([]); // filtrados por fecha
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    inicio: "09:00",
    fin: "13:00",
    box: "",
  });

  // calcula dia_semana basado en la fecha elegida
  const diaSemana = useMemo(() => {
    const d = new Date(fecha + "T00:00:00");
    // JS: 0=Dom..6=Sáb  -> lo pasamos a 0=Lun..6=Dom
    const jsDay = d.getDay();
    return (jsDay + 6) % 7;
  }, [fecha]);

  const fetchHorarios = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/horarios/"); // <-- CRUD real

      const raw = res.data;
      const lista =
        Array.isArray(raw) ? raw :
        Array.isArray(raw?.results) ? raw.results :
        [];

      setHorarios(lista);
    } catch (err) {
      if (err?.response?.status === 401) {
        logout();
        window.location.href = "/login";
        return;
      }
      setError("No se pudieron cargar los horarios.");
      setHorarios([]);
    } finally {
      setLoading(false);
    }
  };

  // cargar horarios al entrar
  useEffect(() => {
    fetchHorarios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // filtrar por día de semana cada vez que cambia fecha u horarios
  useEffect(() => {
    const filtrados = horarios.filter((h) => h.dia_semana === diaSemana);
    setBloquesDia(filtrados);
  }, [horarios, diaSemana]);

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleCrear = async (e) => {
    e.preventDefault();
    setError("");

    if (form.inicio >= form.fin) {
      setError("La hora de inicio debe ser menor a la de fin.");
      return;
    }

    try {
      await api.post("/horarios/", {
        dia_semana: diaSemana,
        inicio: form.inicio,
        fin: form.fin,
        box: form.box || "",
      });

      setForm({ inicio: "09:00", fin: "13:00", box: "" });
      fetchHorarios();
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          "No se pudo crear el bloque. Revisa solapamientos."
      );
    }
  };

  const handleEliminar = async (id) => {
    if (!confirm("¿Eliminar este bloque?")) return;
    try {
      await api.delete(`/horarios/${id}/`);
      fetchHorarios();
    } catch {
      setError("No se pudo eliminar el bloque.");
    }
  };

  return (
    <LayoutVet>
      <div className="space-y-6">
        {/* Encabezado */}
        <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <p className="text-xs font-semibold tracking-[0.25em] text-sky-600 uppercase mb-1">
              VetCare · Veterinario
            </p>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
              Agenda y disponibilidad
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Define tus horarios recurrentes por día de semana.
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Día seleccionado: <b>{DIAS[diaSemana]}</b>
            </p>
          </div>

          {/* Selector fecha */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-700">Fecha:</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            />
          </div>
        </section>

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-2">
          {/* Crear bloque */}
          <div className="rounded-2xl bg-white border border-slate-100 shadow-card p-4">
            <h2 className="text-sm font-semibold text-slate-900">
              Crear bloque horario ({DIAS[diaSemana]})
            </h2>

            <form onSubmit={handleCrear} className="mt-3 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-600">Inicio</label>
                  <input
                    type="time"
                    name="inicio"
                    value={form.inicio}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-slate-50"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-600">Fin</label>
                  <input
                    type="time"
                    name="fin"
                    value={form.fin}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-slate-50"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-600">Box (opcional)</label>
                <input
                  type="text"
                  name="box"
                  value={form.box}
                  onChange={handleChange}
                  placeholder="BOX-1"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-slate-50"
                />
              </div>

              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2 text-xs md:text-sm font-semibold text-white shadow-md hover:shadow-lg hover:opacity-95 transition"
              >
                Agregar bloque
              </button>
            </form>
          </div>

          {/* Lista bloques */}
          <div className="rounded-2xl bg-white border border-slate-100 shadow-card p-4">
            <h2 className="text-sm font-semibold text-slate-900">
              Disponibilidad recurrente ({DIAS[diaSemana]})
            </h2>

            {loading ? (
              <p className="mt-3 text-sm text-slate-500">Cargando...</p>
            ) : bloquesDia.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">
                No hay bloques para este día.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {bloquesDia.map((b) => (
                  <li
                    key={b.id}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {b.inicio} - {b.fin} {b.box ? `(${b.box})` : ""}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Día: {DIAS[b.dia_semana]}
                      </p>
                    </div>

                    <button
                      onClick={() => handleEliminar(b.id)}
                      className="text-xs font-semibold text-red-600 hover:text-red-700"
                    >
                      Eliminar
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </LayoutVet>
  );
}
