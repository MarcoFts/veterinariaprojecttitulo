// src/pages/veterinario/VetAgenda.jsx
import { useEffect, useMemo, useState } from "react";
import LayoutVet from "../../components/layout/LayoutVet";
import api from "../../services/api";
import { logout } from "../../auth";
import dayjs from "dayjs";
import "dayjs/locale/es";
import { ChevronLeft, ChevronRight } from "lucide-react";

dayjs.locale("es");

const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export default function VetAgenda() {
  const hoyISO = useMemo(() => dayjs().format("YYYY-MM-DD"), []);
  const [fecha, setFecha] = useState(hoyISO);

  const [horarios, setHorarios] = useState([]);
  const [bloquesDia, setBloquesDia] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    inicio: "09:00",
    fin: "13:00",
    box: "",
  });

  // control de “semana” mostrada en la tira de días
  const [weekOffset, setWeekOffset] = useState(0); // en días desde hoy

  // MINI-MODAL
  const [showConfirm, setShowConfirm] = useState(false);
  const [bloqueAEliminar, setBloqueAEliminar] = useState(null);

  // -------------------------------
  // DÍA SEMANA SEGÚN FECHA SELECCIONADA
  // -------------------------------
  const diaSemana = useMemo(() => {
    const jsDay = dayjs(fecha).day(); // 0=Dom ... 6=Sáb
    return (jsDay + 6) % 7; // pasamos a 0=Lun ... 6=Dom
  }, [fecha]);

  // -------------------------------
  // CALENDARIO TIPO TIRA DE DÍAS
  // -------------------------------
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

  const handleSelectDia = (value) => {
    setFecha(value);
  };

  const handleWeekNav = (direction) => {
    setWeekOffset((prev) => prev + (direction === "next" ? 7 : -7));
  };

  // -------------------------------
  // FETCH HORARIOS DEL BACKEND
  // -------------------------------
  const fetchHorarios = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await api.get("/horarios/");
      const raw = res.data;

      const lista = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.results)
        ? raw.results
        : [];

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

  useEffect(() => {
    fetchHorarios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setBloquesDia(horarios.filter((h) => h.dia_semana === diaSemana));
  }, [horarios, diaSemana]);

  // -------------------------------
  // FORM
  // -------------------------------
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

  // -------------------------------
  // ELIMINAR BLOQUE
  // -------------------------------
  const solicitarEliminar = (id) => {
    setBloqueAEliminar(id);
    setShowConfirm(true);
  };

  const cancelarEliminar = () => {
    setShowConfirm(false);
    setBloqueAEliminar(null);
  };

  const confirmarEliminar = async () => {
    try {
      await api.delete(`/horarios/${bloqueAEliminar}/`);
      fetchHorarios();
    } catch {
      setError("No se pudo eliminar el bloque.");
    } finally {
      setShowConfirm(false);
      setBloqueAEliminar(null);
    }
  };

  // --------------------------------------------------------------------
  // JSX
  // --------------------------------------------------------------------
  return (
    <LayoutVet>
      <div className="space-y-6">
        {/* ENCABEZADO */}
        <section className="flex flex-col gap-2">
          <p className="text-xs font-semibold tracking-[0.25em] text-sky-600 uppercase mb-1">
            Vetyon · Veterinario
          </p>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
            Agenda y disponibilidad
          </h1>
          <p className="text-sm text-slate-600">
            Define tus horarios recurrentes por día de semana.
          </p>
          <p className="text-xs text-slate-500">
            Día seleccionado: <b>{DIAS[diaSemana]}</b>
          </p>
        </section>

        {/* CALENDARIO CENTRADO ARRIBA DE CREAR BLOQUE */}
        <section className="flex flex-col items-center gap-2">
          <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">
            Fecha
          </span>

          <div className="flex items-center gap-4">
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
                    onClick={() => handleSelectDia(d.value)}
                    className={
                      "flex flex-col items-center min-w-[3rem] px-2 py-1 rounded-lg border text-[11px] " +
                      (fecha === d.value
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
        </section>

        {/* ERRORES */}
        {error && (
          <div className="rounded-2xl bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* CUERPO */}
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
                      onClick={() => solicitarEliminar(b.id)}
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

      {/* MINI-MODAL DE CONFIRMACIÓN */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-xs bg-white rounded-2xl shadow-xl border border-slate-200 animate-fadeScale">
            <div className="px-5 py-4 border-b border-slate-100">
              <p className="text-sm font-semibold text-slate-900">
                Confirmar eliminación
              </p>
            </div>

            <div className="px-5 py-4 text-sm text-slate-700">
              ¿Eliminar este bloque horario?
            </div>

            <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-100">
              <button
                onClick={cancelarEliminar}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Cancelar
              </button>

              <button
                onClick={confirmarEliminar}
                className="rounded-xl bg-red-500 px-4 py-2 text-xs font-semibold text-white hover:bg-red-600 transition"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </LayoutVet>
  );
}
