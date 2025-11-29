// frontend/src/pages/veterinario/VetCitas.jsx
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import LayoutVet from "../../components/layout/LayoutVet";
import {
  CalendarDays,
  Clock,
  PawPrint,
  User,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import {
  getCitas,
  reprogramarCita,
  getDisponibilidad,
} from "../../services/api";

export default function VetCitas() {
  const [fecha, setFecha] = useState(dayjs().format("YYYY-MM-DD"));
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Estado para reprogramar
  const [showModal, setShowModal] = useState(false);
  const [selectedCita, setSelectedCita] = useState(null);
  const [nuevaFecha, setNuevaFecha] = useState(dayjs().format("YYYY-MM-DD"));
  const [slots, setSlots] = useState([]);
  const [slotSeleccionado, setSlotSeleccionado] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [saving, setSaving] = useState(false);

  // --- Cargar citas del día ---
  const loadCitas = async () => {
    setLoading(true);
    setError("");
    try {
      const resp = await getCitas({ fecha });
      setCitas(resp.data || []);
    } catch (err) {
      if (err?.response?.status === 401) {
        setError("Tu sesión expiró. Vuelve a iniciar sesión.");
      } else {
        setError("No se pudieron cargar las citas desde el servidor.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCitas();
  }, [fecha]);

  // --- Cargar slots disponibles para la cita seleccionada ---
  const cargarSlots = async (cita, fechaSlot) => {
    if (!cita) return;
    setLoadingSlots(true);
    setSlots([]);
    try {
      const resp = await getDisponibilidad({
        veterinario_id: cita.veterinario,       // es el id de usuario vet
        fecha: fechaSlot,
        duracion: cita.duracion_min || 30,      // si no existe, usamos 30
        box: cita.box || "",
      });

      setSlots(resp.data?.slots || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSlots(false);
    }
  };

  // --- Abrir modal de reprogramación ---
  const abrirReprogramar = async (cita) => {
    setSelectedCita(cita);
    const fechaActual = cita.inicio?.slice(0, 10) || fecha;
    setNuevaFecha(fechaActual);
    setSlotSeleccionado("");
    setSlots([]);
    setShowModal(true);
    await cargarSlots(cita, fechaActual);
  };

  // --- Cuando cambia la fecha dentro del modal ---
  const handleFechaModalChange = async (e) => {
    const nueva = e.target.value;
    setNuevaFecha(nueva);
    setSlotSeleccionado("");
    await cargarSlots(selectedCita, nueva);
  };

  // --- Confirmar reprogramación ---
  const handleReprogramarSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCita || !nuevaFecha || !slotSeleccionado) return;

    const inicio = `${nuevaFecha}T${slotSeleccionado}`;

    setSaving(true);
    try {
      await reprogramarCita(selectedCita.id, {
        inicio,
        duracion: selectedCita.duracion_min || 30,
        box: selectedCita.box || "",
      });
      setShowModal(false);
      setSelectedCita(null);
      await loadCitas();
    } catch (err) {
      console.error(err);
      alert("No se pudo reprogramar la cita. Revisa la disponibilidad.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <LayoutVet>
      <div className="space-y-6">
        {/* Encabezado */}
        <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <p className="text-xs font-semibold tracking-[0.25em] text-sky-600 uppercase mb-1">
              Vetyon · Veterinario
            </p>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
              Citas y estadísticas
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Revisa tus citas del día, reprograma horarios y gestiona la agenda
              médica digital en tiempo real.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-700">
              Fecha:
            </label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            />
            <button
              onClick={loadCitas}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw className="h-4 w-4" />
              Actualizar
            </button>
          </div>
        </section>

        {/* Mensajes de estado */}
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        {/* Lista de citas */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 md:p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-sky-600" />
              <h2 className="text-sm font-semibold text-slate-900">
                Citas del día
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              {dayjs(fecha).format("dddd DD [de] MMMM YYYY")}
            </p>
          </div>

          {loading ? (
            <p className="text-sm text-slate-500">Cargando citas...</p>
          ) : citas.length === 0 ? (
            <p className="text-sm text-slate-500">
              No hay citas registradas para esta fecha.
            </p>
          ) : (
            <div className="space-y-3">
              {citas.map((cita) => (
                <div
                  key={cita.id}
                  className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 rounded-xl border border-slate-200 px-3 py-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center text-slate-500 mt-0.5">
                      <Clock className="h-4 w-4 mb-1" />
                      <span className="text-xs font-medium">
                        {cita.inicio
                          ? dayjs(cita.inicio).format("HH:mm")
                          : "--:--"}
                      </span>
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700">
                          <PawPrint className="h-3 w-3" />
                          Mascota #{cita.mascota ?? "—"}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-700">
                          <User className="h-3 w-3" />
                          Cliente #{cita.cliente ?? "—"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">
                        Estado:{" "}
                        <span className="font-semibold capitalize">
                          {cita.estado}
                        </span>{" "}
                        · Box:{" "}
                        <span className="font-mono text-[11px]">
                          {cita.box || "N/A"}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 md:justify-end">
                    <button
                      onClick={() => abrirReprogramar(cita)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-700"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Reprogramar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Modal simple para reprogramar */}
        {showModal && selectedCita && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-5">
              <h3 className="text-base font-semibold text-slate-900 mb-3">
                Reprogramar cita #{selectedCita.id}
              </h3>

              <form onSubmit={handleReprogramarSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-700">
                    Nueva fecha
                  </label>
                  <input
                    type="date"
                    value={nuevaFecha}
                    onChange={handleFechaModalChange}
                    className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-700">
                    Horario disponible
                  </label>

                  {loadingSlots ? (
                    <p className="text-xs text-slate-500">
                      Cargando horarios disponibles...
                    </p>
                  ) : slots.length === 0 ? (
                    <p className="text-xs text-slate-500">
                      No hay horarios disponibles para esta fecha.
                    </p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                      {slots.map((h) => (
                        <button
                          key={h}
                          type="button"
                          onClick={() => setSlotSeleccionado(h)}
                          className={
                            "text-xs border rounded-lg px-2 py-1 text-center " +
                            (slotSeleccionado === h
                              ? "bg-sky-600 text-white border-sky-600"
                              : "bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100")
                          }
                        >
                          {h}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setSelectedCita(null);
                    }}
                    className="inline-flex items-center rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={!slotSeleccionado || saving}
                    className="inline-flex items-center rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60 disabled:cursor-not-allowed hover:bg-sky-700"
                  >
                    {saving ? "Guardando..." : "Confirmar cambio"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </LayoutVet>
  );
}
