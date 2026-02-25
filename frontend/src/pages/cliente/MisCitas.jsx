// src/pages/cliente/MisCitas.jsx
import { useEffect, useMemo, useState } from "react";
import LayoutCliente from "../../components/layout/LayoutCliente";
import ModalReprogramarCitaCliente from "../../components/modals/ModalReprogramarCitaCliente";

import dayjs from "dayjs";
import "dayjs/locale/es";

import {
    CalendarDays,
    Clock,
    RefreshCw,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

import { getCitas, cancelarCita } from "../../services/api";

dayjs.locale("es");

export default function MisCitas() {
    const hoy = dayjs().format("YYYY-MM-DD");

    const [fecha, setFecha] = useState(hoy);
    const [weekOffset, setWeekOffset] = useState(0);
    const [citasDia, setCitasDia] = useState([]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Reprogramar
    const [showModal, setShowModal] = useState(false);
    const [selectedCita, setSelectedCita] = useState(null);

    // Cancelar
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmCitaId, setConfirmCitaId] = useState(null);
    const [loadingCancelar, setLoadingCancelar] = useState(false);

    // ---------- Helpers ----------

    const citasOrdenadas = useMemo(() => {
        return [...citasDia].sort((a, b) =>
            dayjs(a.inicio).isAfter(dayjs(b.inicio)) ? 1 : -1
        );
    }, [citasDia]);

    // Mini calendario para navegar entre días
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

    const currentMonthLabel = useMemo(() => {
        return dayjs().add(weekOffset, "day").format("MMM YYYY");
    }, [weekOffset]);

    const getEstadoStyles = (estado) => {
        const val = String(estado || "").toLowerCase();

        switch (val) {
            case "confirmada":
                return "bg-emerald-100 text-emerald-700 border border-emerald-200";
            case "cancelada":
                return "bg-red-100 text-red-700 border border-red-200";
            case "completada":
                return "bg-slate-100 text-slate-700 border border-slate-200";
            case "pendiente":
            default:
                return "bg-sky-100 text-sky-700 border border-sky-200";
        }
    };

    // ---------- API ----------

    const cargarCitas = async () => {
        setLoading(true);
        setError("");

        try {
            const resp = await getCitas({ fecha });
            setCitasDia(resp.data || []);
        } catch (err) {
            if (err?.response?.status === 401) {
                setError("Tu sesión expiró. Vuelve a iniciar sesión.");
            } else {
                setError("No se pudieron cargar las citas.");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarCitas();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fecha]);

    // ---------- Handlers fecha / navegación ----------

    const handleSelectDia = (dateValue) => {
        setFecha(dateValue);
    };

    const handleWeekNav = (direction) => {
        let nextOffset = direction === "next" ? weekOffset + 7 : weekOffset - 7;
        if (nextOffset < 0) nextOffset = 0;

        const base = dayjs().add(nextOffset, "day");
        const newDate = base.format("YYYY-MM-DD");

        setWeekOffset(nextOffset);
        setFecha(newDate);
    };

    const handleChangeFechaHeader = (e) => {
        const val = e.target.value;
        if (!val) return;

        setFecha(val);

        const diffDays = dayjs(val).diff(dayjs().startOf("day"), "day");
        const aligned = diffDays < 0 ? 0 : diffDays - (diffDays % 7);
        setWeekOffset(aligned);
    };

    // ---------- Reprogramar / Cancelar ----------

    const abrirModalReprogramar = (cita) => {
        setSelectedCita(cita);
        setShowModal(true);
    };

    const handleCancelarCita = (id) => {
        setConfirmCitaId(id);
        setConfirmOpen(true);
    };

    const confirmarCancelacion = async () => {
        if (!confirmCitaId) return;

        setLoadingCancelar(true);
        try {
            await cancelarCita(confirmCitaId);
            await cargarCitas();
            setConfirmOpen(false);
            setConfirmCitaId(null);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingCancelar(false);
        }
    };

    // ---------- Render ----------

    return (
        <LayoutCliente>
            <div className="space-y-6">
                {/* Header superior con selector de fecha */}
                <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-xl md:text-2xl font-semibold text-slate-900">
                            Mis citas
                        </h1>
                        <p className="text-sm text-slate-600 mt-1">
                            Revisa, reprograma o cancela las citas que has agendado para tus
                            mascotas.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-slate-700">
                            Fecha:
                        </label>
                        <input
                            type="date"
                            value={fecha}
                            onChange={handleChangeFechaHeader}
                            className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                        />
                        <button
                            type="button"
                            onClick={cargarCitas}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Actualizar
                        </button>
                    </div>
                </section>

                {error && (
                    <div className="flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                        <AlertCircle className="h-4 w-4" />
                        <span>{error}</span>
                    </div>
                )}
                {/* Bloque principal: mini calendario + listado */}
                <section className="bg-white/90 rounded-2xl border border-slate-200 shadow-sm p-4 md:p-5 space-y-5">
                    {/* Mini calendario */}
                    <div className="flex flex-col items-center gap-3 md:gap-4">
                        {/* Flechas + mes */}
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => handleWeekNav("prev")}
                                className="p-1.5 rounded-full border border-slate-300 text-slate-600 hover:bg-slate-50"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <p className="text-xs md:text-sm font-semibold text-slate-800 uppercase tracking-wide">
                                {currentMonthLabel}
                            </p>
                            <button
                                type="button"
                                onClick={() => handleWeekNav("next")}
                                className="p-1.5 rounded-full border border-slate-300 text-slate-600 hover:bg-slate-50"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Días de la semana */}
                        <div className="flex gap-1 overflow-x-auto pb-1 justify-center w-full">
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

                    {/* Listado de citas */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 mb-1">
                            <CalendarDays className="h-5 w-5 text-sky-600" />
                            <h2 className="text-sm font-semibold text-slate-900">
                                Citas del día
                            </h2>
                        </div>

                        {loading ? (
                            <p className="text-sm text-slate-500">Cargando citas...</p>
                        ) : citasOrdenadas.length === 0 ? (
                            <p className="text-sm text-slate-500">
                                No tienes citas para este día.
                            </p>
                        ) : (
                            <ul className="space-y-3">
                                {citasOrdenadas.map((cita) => (
                                    <li
                                        key={cita.id}
                                        className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm flex flex-col md:flex-row md:items-center md:justify-between gap-3"
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
                                                <p className="font-medium text-slate-800">
                                                    {cita.mascota_nombre || `Mascota #${cita.mascota}`}
                                                </p>
                                                <p className="text-xs text-slate-600">
                                                    Vet:{" "}
                                                    {cita.veterinario_nombre ||
                                                        `Veterinario #${cita.veterinario}`}
                                                </p>
                                                <p className="text-xs text-slate-600 mt-1">
                                                    Motivo: {cita.motivo || "Sin motivo registrado"}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 md:justify-end">
                                            <span
                                                className={
                                                    "inline-flex items-center rounded-full text-[11px] px-2 py-1 " +
                                                    getEstadoStyles(cita.estado)
                                                }
                                            >
                                                {cita.estado || "pendiente"}
                                            </span>

                                            {String(cita.estado).toLowerCase() !== "cancelada" && (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() => abrirModalReprogramar(cita)}
                                                        className="inline-flex items-center rounded-full bg-sky-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-sky-700"
                                                    >
                                                        Reprogramar
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCancelarCita(cita.id)}
                                                        className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-[11px] font-medium text-red-600 hover:bg-red-100"
                                                    >
                                                        Cancelar
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </section>

                {/* Modal de reprogramar */}
                <ModalReprogramarCitaCliente
                    open={showModal}
                    cita={selectedCita}
                    onClose={() => {
                        setShowModal(false);
                        setSelectedCita(null);
                    }}
                    onSaved={async () => {
                        await cargarCitas();
                    }}
                />

                {/* Mini-modal de confirmación de cancelación */}
                {confirmOpen && (
                    <div className="fixed inset-0 flex items-center justify-center z-[9999]">
                        <div className="bg-white p-6 rounded-xl shadow-xl w-[90%] max-w-sm border border-neutral-200">
                            <h2 className="text-lg font-semibold text-neutral-800 mb-2">
                                ¿Cancelar cita?
                            </h2>
                            <p className="text-sm text-neutral-600 mb-4">
                                Esta acción no se puede deshacer. ¿Deseas cancelar esta cita?
                            </p>
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setConfirmOpen(false)}
                                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                                >
                                    No, volver
                                </button>
                                <button
                                    type="button"
                                    onClick={confirmarCancelacion}
                                    disabled={loadingCancelar}
                                    className="rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                                >
                                    {loadingCancelar ? "Cancelando..." : "Sí, cancelar"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </LayoutCliente>
    );
}
