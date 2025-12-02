// src/pages/veterinario/VetAgendaDia.jsx
import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import LayoutVet from "../../components/layout/LayoutVet";
import ModalCrearCita from "../../components/modals/ModalCrearCita";
import ModalReprogramarCita from "../../components/modals/ModalReprogramarCita";
import {
  me as getUserProfile,
  getDisponibilidad,
  getCitas,
  confirmarCita,
  getClientes, // 👈 para resolver nombre del dueño
} from "../../services/api";

import dayjs from "dayjs";
import "dayjs/locale/es";
dayjs.locale("es");

const todayStr = () => dayjs().format("YYYY-MM-DD");

// suma minutos a "HH:MM" y devuelve "HH:MM"
const sumarMinutos = (horaStr, minutos) => {
  const [h, m] = horaStr.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m + minutos, 0, 0);
  return d.toTimeString().slice(0, 5);
};

export default function VetAgendaDia() {
  const [fecha, setFecha] = useState(todayStr()); // día seleccionado para el resumen
  const [weekOffset, setWeekOffset] = useState(0); // desplazamiento de la semana

  const [slots, setSlots] = useState([]); // todos los slots de la semana (cada uno con fecha)
  const [horas, setHoras] = useState([]); // filas del calendario (09:00, 09:30, ...)

  const [slotParaAsignar, setSlotParaAsignar] = useState(null);
  const [citaParaReprogramar, setCitaParaReprogramar] = useState(null);

  const [vetId, setVetId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [reloadAgenda, setReloadAgenda] = useState(0);

  // mapa idCliente -> nombre (Marco Fuentes, Prueba 2222, etc.)
  const [clientesMap, setClientesMap] = useState({});

  // tira de días de la semana visible
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

  const currentWeekLabel = useMemo(() => {
    const base = dayjs().add(weekOffset, "day");
    const end = base.add(6, "day");
    return `${base.format("DD MMM")} – ${end.format("DD MMM YYYY")}`;
  }, [weekOffset]);

  const handleSelectDia = (value) => setFecha(value);

  const handleWeekNav = (direction) =>
    setWeekOffset((prev) => prev + (direction === "next" ? 7 : -7));

  // modal confirmar cita
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [citaAConfirmar, setCitaAConfirmar] = useState(null);
  const [boxConfirm, setBoxConfirm] = useState("");
  const [savingConfirm, setSavingConfirm] = useState(false);

  const abrirConfirmar = (slot) => {
    if (!slot.citaId) return;
    setCitaAConfirmar(slot);
    setBoxConfirm(slot.box || "");
    setShowConfirmModal(true);
  };

  const cerrarConfirmar = () => {
    setShowConfirmModal(false);
    setCitaAConfirmar(null);
    setBoxConfirm("");
  };

  const handleConfirmarCita = async (e) => {
    e.preventDefault();
    if (!citaAConfirmar) return;

    setSavingConfirm(true);
    try {
      await confirmarCita(citaAConfirmar.citaId, {
        estado: "confirmada",
        box: boxConfirm || null,
      });

      setSlots((prev) =>
        prev.map((s) =>
          s.id === citaAConfirmar.id
            ? {
                ...s,
                estadoCita: "confirmada",
                estado: "ocupada",
                box: boxConfirm || null,
              }
            : s
        )
      );
      cerrarConfirmar();
    } catch (err) {
      console.error("Error confirmando cita:", err);
      setError("No se pudo confirmar la cita.");
    } finally {
      setSavingConfirm(false);
    }
  };

  // 1) obtener perfil para saber vetId
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await getUserProfile();
        if (res.data?.id) setVetId(res.data.id);
      } catch (err) {
        console.error("Error obteniendo perfil:", err);
        setError("No se pudo obtener la información del veterinario.");
      }
    };
    fetchUser();
  }, []);

  // 1.5) cargar clientes para poder resolver nombre del dueño
  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const res = await getClientes();
        const lista = Array.isArray(res.data)
          ? res.data
          : res.data?.results || [];
        const map = {};
        lista.forEach((c) => {
          map[c.id] =
            c.nombre_completo || c.nombre || c.email || `Cliente #${c.id}`;
        });
        setClientesMap(map);
      } catch (err) {
        console.error("Error cargando clientes:", err);
      }
    };

    fetchClientes();
  }, []);

  // 2) cargar agenda de la semana (7 días) desde backend
  useEffect(() => {
    if (!vetId) return;

    const fetchAgendaSemana = async () => {
      setLoading(true);
      setError("");

      try {
        const base = dayjs().add(weekOffset, "day");
        const diasSemana = Array.from({ length: 7 }, (_, i) => {
          const d = base.add(i, "day");
          return d.format("YYYY-MM-DD");
        });

        const allSlots = [];
        const horasSet = new Set();

        for (const fechaDia of diasSemana) {
          const [dispRes, citasRes] = await Promise.all([
            getDisponibilidad({
              veterinario_id: vetId,
              fecha: fechaDia,
              duracion: 30,
              box: "",
            }),
            getCitas({ fecha: fechaDia }),
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
            const estadoCita = c.estado || "pendiente";

            const motivo =
              c.motivo ||
              c.motivo_consulta ||
              c.motivo_consulta_nombre ||
              c.motivo_texto ||
              null;

            // Duración de la cita (si el backend la envía, la usamos; si no, 30 min)
            const duracion =
              c.duracion || c.duracion_minutos || c.duracion_min || 30;

            // ID posible del cliente
            const clienteIdCrudo =
              c.cliente_id !== undefined && c.cliente_id !== null
                ? c.cliente_id
                : c.cliente ?? null;

            // Intentamos nombres que vengan directo del backend
            let pacienteNombre =
              c.cliente_nombre ||
              c.cliente_nombre_completo ||
              c.cliente_full_name ||
              c.cliente?.nombre_completo ||
              c.cliente?.nombre ||
              c.cliente?.full_name ||
              c.mascota?.cliente_nombre ||
              c.mascota?.cliente?.nombre_completo ||
              c.mascota?.cliente?.nombre ||
              null;

            // Si no vino nombre, lo buscamos en el mapa de clientes
            if (!pacienteNombre && clienteIdCrudo && clientesMap) {
              const idNumber = Number(clienteIdCrudo);
              if (!Number.isNaN(idNumber) && clientesMap[idNumber]) {
                pacienteNombre = clientesMap[idNumber];
              }
            }

            // Fallback final
            if (!pacienteNombre && clienteIdCrudo) {
              pacienteNombre = `Cliente #${clienteIdCrudo}`;
            }

            return {
              ...c,
              fecha: fechaDia,
              horaInicio,
              horaFin: sumarMinutos(horaInicio, duracion),
              duracion,
              estadoCita,
              motivo,
              pacienteNombre,
            };
          });

          const horasDiaSet = new Set();
          libres.forEach((h) => horasDiaSet.add(h));
          citas.forEach((c) => horasDiaSet.add(c.horaInicio));

          const horasOrdenadasDia = Array.from(horasDiaSet).sort();

          horasOrdenadasDia.forEach((hora) => {
            horasSet.add(hora); // para la tabla global

            const cita = citas.find((c) => c.horaInicio === hora);

            if (cita) {
              const estadoCita = cita.estadoCita;

              const mascotaNombre =
                cita.mascota_nombre || cita.mascota?.nombre || null;

              const pacienteFinal =
                cita.pacienteNombre ||
                cita.cliente_nombre ||
                cita.cliente?.nombre_completo ||
                cita.cliente?.nombre ||
                (cita.cliente_id ? `Cliente #${cita.cliente_id}` : null) ||
                (cita.cliente ? `Cliente #${cita.cliente}` : null);

              allSlots.push({
                id: cita.id || `${fechaDia}-${hora}`,
                fecha: fechaDia,
                horaInicio: hora,
                horaFin: cita.horaFin,
                duracion: cita.duracion || cita.duracion_minutos || 30,
                estado: estadoCita === "cancelada" ? "cancelada" : "ocupada",
                estadoCita,
                paciente: pacienteFinal,
                mascota: mascotaNombre,
                motivo: cita.motivo || null,
                citaId: cita.id,
                box: cita.box || cita.box_nombre || "",
              });
            } else {
              allSlots.push({
                id: `${fechaDia}-${hora}`,
                fecha: fechaDia,
                horaInicio: hora,
                horaFin: sumarMinutos(hora, 30),
                estado: "libre",
                estadoCita: null,
                paciente: null,
                mascota: null,
                motivo: null,
                citaId: null,
                box: "",
              });
            }
          });
        }

        setSlots(allSlots);
        setHoras(Array.from(horasSet).sort());
      } catch (err) {
        console.error("Error cargando agenda de la semana:", err);
        setError("No se pudo cargar la agenda para esa semana.");
        setSlots([]);
        setHoras([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAgendaSemana();
  }, [vetId, weekOffset, reloadAgenda, clientesMap]);

  const handleAsignarConfirm = (payload) => {
    // { slot_id, cliente_id, cliente_nombre, mascota_id, mascota_nombre, motivo, box }
    setSlots((prev) =>
      prev.map((s) =>
        s.id === payload.slot_id
          ? {
              ...s,
              estado: "ocupada",
              estadoCita: "pendiente",
              paciente: payload.cliente_nombre || s.paciente,
              mascota: payload.mascota_nombre || s.mascota,
              motivo: payload.motivo || s.motivo,
              box: payload.box || s.box,
            }
          : s
      )
    );
    setSlotParaAsignar(null);
    // si quisieras recargar del backend:
    // setReloadAgenda((n) => n + 1);
  };

  const handleCancelarSlot = (slotId) => {
    setSlots((prev) =>
      prev.map((s) =>
        s.id === slotId
          ? { ...s, estado: "cancelada", estadoCita: "cancelada" }
          : s
      )
    );
  };

  const getEstadoChip = (slot) => {
    if (slot.estado === "libre")
      return (
        <span className="inline-flex items-center rounded-full border border-dashed border-emerald-300 bg-emerald-50 px-2 py-[2px] text-[10px] font-medium text-emerald-700">
          Libre
        </span>
      );

    if (slot.estado === "cancelada")
      return (
        <span className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-2 py-[2px] text-[10px] font-medium text-rose-700">
          Cancelada
        </span>
      );

    if (slot.estadoCita === "confirmada") {
      return (
        <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-2 py-[2px] text-[10px] font-medium text-sky-700">
          Confirmada
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-[2px] text-[10px] font-medium text-amber-800">
        Pendiente
      </span>
    );
  };

  const getSlotCardClasses = (slot) => {
    if (slot.estado === "libre")
      return "border border-dashed border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50";

    if (slot.estado === "cancelada")
      return "border border-rose-200 bg-rose-50/60 text-slate-400 line-through";

    return "border border-sky-200 bg-sky-50 hover:bg-sky-100";
  };

  const slotsDelDiaSeleccionado = useMemo(
    () => slots.filter((s) => s.fecha === fecha),
    [slots, fecha]
  );

  return (
    <LayoutVet>
      <div className="space-y-8">
        {/* Encabezado */}
        <section className="flex flex-col gap-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-[0.18em] text-sky-600 uppercase">
                Vetyon · Veterinario
              </p>
              <h1 className="mt-1 text-2xl font-bold text-slate-900">
                Agenda semanal
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Visualiza tus horas disponibles y tus citas distribuidas en el
                calendario semanal.
              </p>
              {error && (
                <p className="mt-2 text-xs text-rose-500">{error}</p>
              )}
            </div>

            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                <CalendarDays size={18} className="text-sky-600" />
                <span>{currentWeekLabel}</span>
              </div>
              <span className="text-[11px] text-slate-500">
                Día seleccionado:{" "}
                {dayjs(fecha).format("dddd DD [de] MMMM YYYY")}
              </span>
            </div>
          </div>

          {/* Tira de días */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">
              Selecciona un día para el resumen
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
                      <span className="text-sm font-semibold">
                        {d.dia}
                      </span>
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
          </div>
        </section>

        {/* Contenido principal */}
        <section className="grid grid-cols-1 lg:grid-cols-[1.7fr,1fr] gap-6">
          {/* Calendario semanal */}
          <div className="rounded-2xl bg-white shadow-sm border border-slate-100 p-4 md:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Calendario semanal
                </p>
                <p className="text-xs text-slate-500">
                  Cada columna es un día, cada fila un bloque horario de 30
                  minutos.
                </p>
              </div>
            </div>

            {loading && (
              <p className="text-xs text-slate-500">
                Cargando agenda de la semana...
              </p>
            )}

            {!loading && horas.length === 0 && (
              <p className="text-xs text-slate-500">
                No hay horas generadas para esta semana.
              </p>
            )}

            {!loading && horas.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-y-2">
                  <thead>
                    <tr>
                      <th className="w-16 text-right text-[11px] font-semibold text-slate-500 pr-2">
                        Hora
                      </th>
                      {upcomingDays.map((d) => (
                        <th
                          key={d.value}
                          className="text-center text-[11px] font-semibold text-slate-600"
                        >
                          <div className="flex flex-col items-center">
                            <span className="uppercase">{d.dow}</span>
                            <span className="text-sm">{d.dia}</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {horas.map((hora) => (
                      <tr key={hora}>
                        {/* columna de hora */}
                        <td className="align-top text-right text-[11px] font-medium text-slate-500 pr-2 pt-2">
                          {hora}
                        </td>

                        {upcomingDays.map((d) => {
                          const slot = slots.find(
                            (s) =>
                              s.fecha === d.value &&
                              s.horaInicio === hora
                          );

                          if (!slot) {
                            return (
                              <td key={d.value} className="align-top px-1">
                                <div className="h-14 rounded-xl border border-dashed border-slate-100 bg-slate-50/40" />
                              </td>
                            );
                          }

                          return (
                            <td key={d.value} className="align-top px-1">
                              <div
                                className={
                                  "h-full rounded-xl px-3 py-2 text-[11px] cursor-pointer transition " +
                                  getSlotCardClasses(slot)
                                }
                                onClick={() => {
                                  if (slot.estado === "libre") {
                                    setSlotParaAsignar(slot);
                                  } else if (slot.citaId) {
                                    abrirConfirmar(slot);
                                  }
                                }}
                              >
                                {slot.estado === "libre" ? (
                                  <div className="flex flex-col h-full justify-between">
                                    <div className="flex items-center justify-between">
                                      <span className="font-semibold text-slate-800">
                                        Horario libre
                                      </span>
                                      {getEstadoChip(slot)}
                                    </div>
                                    <div className="flex justify-end mt-1">
                                      <button
                                        type="button"
                                        className="rounded-lg bg-sky-600 px-3 py-1 text-[10px] font-semibold text-white hover:bg-sky-700"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSlotParaAsignar(slot);
                                        }}
                                      >
                                        Asignar cita
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex flex-col gap-1">
                                    <div className="flex items-start justify-between gap-1">
                                      <div>
                                        {/* rango de hora */}
                                        <p className="text-[10px] font-semibold text-slate-500">
                                          {slot.horaInicio} –{" "}
                                          {slot.horaFin}
                                        </p>

                                        {/* mascota */}
                                        <p className="text-[11px] font-semibold text-slate-900 line-clamp-1">
                                          {slot.mascota ||
                                            "Mascota sin nombre"}
                                        </p>

                                        {/* dueño */}
                                        <p className="text-[10px] text-slate-600 line-clamp-1">
                                          Dueño:{" "}
                                          {slot.paciente ||
                                            "Cliente no registrado"}
                                        </p>
                                      </div>

                                      <div className="flex flex-col items-end gap-1">
                                        {getEstadoChip(slot)}
                                        {slot.box && (
                                          <span className="text-[10px] text-slate-500">
                                            Box:{" "}
                                            <strong>{slot.box}</strong>
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <p className="text-[10px] text-slate-600 line-clamp-2">
                                      Motivo:{" "}
                                      {slot.motivo ||
                                        "Sin motivo registrado"}
                                    </p>
                                    <div className="flex justify-end gap-1.5 mt-1">
                                      {/* Confirmar (solo si no está ya confirmada ni cancelada) */}
                                      {slot.estado !== "cancelada" &&
                                        slot.estadoCita !==
                                          "confirmada" && (
                                          <button
                                            type="button"
                                            className="rounded-lg bg-emerald-500 px-2 py-1 text-[10px] font-semibold text-white hover:bg-emerald-600"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              abrirConfirmar(slot);
                                            }}
                                          >
                                            Confirmar
                                          </button>
                                        )}

                                      {/* Reprogramar */}
                                      <button
                                        type="button"
                                        className="rounded-lg bg-white/70 px-2 py-1 text-[10px] font-semibold text-sky-700 border border-sky-200 hover:bg-sky-50"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (!slot.citaId) return;
                                          setCitaParaReprogramar({
                                            id: slot.citaId,
                                            inicio: `${slot.fecha}T${slot.horaInicio}`,
                                            box: slot.box || "",
                                          });
                                        }}
                                      >
                                        Reprogramar
                                      </button>

                                      {/* Cancelar */}
                                      <button
                                        type="button"
                                        className="rounded-lg bg-white/70 px-2 py-1 text-[10px] font-semibold text-rose-700 border border-rose-200 hover:bg-rose-50"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleCancelarSlot(slot.id);
                                        }}
                                      >
                                        Cancelar
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Resumen del día seleccionado */}
          <div className="rounded-2xl bg-whiteshadow-sm border border-slate-100 p-4 md:p-5 space-y-4">
            <p className="text-sm font-semibold text-slate-900">
              Resumen del día
            </p>
            <p className="text-[11px] text-slate-500">
              {dayjs(fecha).format("dddd DD [de] MMMM YYYY")}
            </p>
            <ul className="space-y-2 text-xs text-slate-600">
              <li>
                • Horas libres:{" "}
                {
                  slotsDelDiaSeleccionado.filter(
                    (s) => s.estado === "libre"
                  ).length
                }
              </li>
              <li>
                • Horas ocupadas:{" "}
                {
                  slotsDelDiaSeleccionado.filter(
                    (s) => s.estado === "ocupada"
                  ).length
                }
              </li>
              <li>
                • Horas canceladas:{" "}
                {
                  slotsDelDiaSeleccionado.filter(
                    (s) => s.estado === "cancelada"
                  ).length
                }
              </li>
            </ul>
            <p className="text-[11px] text-slate-400">
              Esta vista se alimenta de tus horarios, bloqueos y citas
              almacenadas en el backend.
            </p>
          </div>
        </section>
      </div>
      
      <ModalCrearCita
        open={!!slotParaAsignar}
        slot={slotParaAsignar}
        onClose={() => setSlotParaAsignar(null)}
        onConfirm={(data) => {
          handleAsignarConfirm(data);      // actualiza UI inmediata
          setReloadAgenda((n) => n + 1);   // 🔥 fuerza recarga del backend
        }}
      />


      {/* Modal reprogramar */}
      <ModalReprogramarCita
        open={!!citaParaReprogramar}
        cita={citaParaReprogramar}
        vetId={vetId}
        onClose={() => setCitaParaReprogramar(null)}
        onConfirm={({ id, nueva_fecha, nueva_hora }) => {
          setSlots((prev) =>
            prev.map((s) =>
              s.citaId === id
                ? {
                    ...s,
                    fecha: nueva_fecha || s.fecha,
                    horaInicio: nueva_hora,
                    horaFin: sumarMinutos(nueva_hora, 30),
                  }
                : s
            )
          );
        }}
      />

      {/* Modal confirmar cita + sala */}
      {showConfirmModal && citaAConfirmar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl border border-slate-200">
            <div className="px-5 py-4 border-b border-slate-100">
              <p className="text-sm font-semibold text-slate-900">
                Confirmar cita
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {citaAConfirmar.fecha} · {citaAConfirmar.horaInicio} -{" "}
                {citaAConfirmar.horaFin}
              </p>
            </div>

            <form
              onSubmit={handleConfirmarCita}
              className="px-5 py-4 space-y-3"
            >
              <div>
                <label className="text-xs font-medium text-slate-700">
                  Sala / Box asignado
                </label>
                <input
                  type="text"
                  value={boxConfirm}
                  onChange={(e) => setBoxConfirm(e.target.value)}
                  placeholder="BOX-1, BOX-2..."
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              <p className="text-[11px] text-slate-500">
                Al confirmar la cita quedará marcada como{" "}
                <span className="font-semibold">confirmada</span> y se guardará
                la sala asignada.
              </p>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 mt-2">
                <button
                  type="button"
                  onClick={cerrarConfirmar}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingConfirm}
                  className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-600 disabled:opacity-60"
                >
                  {savingConfirm ? "Confirmando..." : "Confirmar cita"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </LayoutVet>
  );
}
