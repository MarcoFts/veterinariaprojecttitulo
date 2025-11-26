import { Link } from "react-router-dom";
import LayoutVet from "../../components/layout/LayoutVet";
import {
  CalendarDays,
  Users2,
  BarChart3,
  NotebookPen,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export default function VetHome() {
  // Datos estáticos de ejemplo (luego los puedes conectar al backend)
  const kpis = [
    { label: "Citas hoy", value: "0", trend: "Sin atenciones por ahora" },
    { label: "Citas este mes", value: "0", trend: "Pendiente de agenda" },
    { label: "Pacientes activos", value: "0", trend: "Aún sin registros" },
  ];

  const proximasCitas = [
    {
      hora: "—",
      paciente: "Sin citas agendadas",
      detalle: "Cuando registres citas, aparecerán aquí.",
      estado: "libre",
    },
  ];

  return (
    <LayoutVet>
      <div className="space-y-10 md:space-y-12">
        {/* HERO SUPER PREMIUM */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-50 via-white to-blue-50 border border-white shadow-[0_18px_55px_rgba(15,23,42,0.10)] px-6 py-6 md:px-8 md:py-7">
          {/* Glows decorativos */}
          <div className="pointer-events-none absolute -top-16 -right-10 h-40 w-40 rounded-full bg-sky-200/40 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-16 h-48 w-48 rounded-full bg-blue-300/30 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            {/* Texto principal */}
            <div className="max-w-xl">
              <p className="text-xs font-semibold tracking-[0.25em] text-sky-600 uppercase mb-2">
                VetCare · Panel Veterinario
              </p>
              <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 leading-tight">
                Panel del profesional
              </h1>
              <p className="mt-2 text-sm md:text-base text-slate-600 leading-relaxed">
                Administra tu agenda, revisa las próximas citas y gestiona las
                mascotas que atiendes desde un entorno diseñado para el trabajo
                diario en clínica.
              </p>

              {/* Pequeña línea informativa */}
              <p className="mt-3 text-[11px] md:text-xs text-slate-500">
                Estos datos se conectarán al backend de VetCare en el futuro.
              </p>
            </div>

            {/* Acciones principales */}
            <div className="flex flex-col items-stretch gap-3 md:items-end">
              <div className="flex gap-3 justify-end">
                <Link
                  to="/veterinario/agenda"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white/90 px-4 py-2 text-xs md:text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition"
                >
                  Ver agenda completa
                </Link>

                <Link
                  to="/veterinario/agenda"
                  className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2 text-xs md:text-sm font-semibold text-white shadow-md hover:shadow-lg hover:opacity-95 transition"
                >
                  Actualizar disponibilidad
                </Link>
              </div>

              {/* Mini resumen de hoy */}
              <div className="rounded-2xl bg-white/70 border border-slate-100 px-4 py-2 shadow-sm backdrop-blur-md flex items-center gap-2 text-[11px] text-slate-600">
                <Clock className="h-4 w-4 text-sky-500 flex-shrink-0" />

                <span className="font-semibold text-slate-900">Hoy:</span>

                <span className="text-slate-600">
                 Sin citas registradas. Tu agenda está disponible.
                </span>
              </div>
            </div>
          </div>

          {/* KPIs inferiores */}
          <div className="relative z-10 mt-6 grid gap-3 md:grid-cols-3">
            {kpis.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl bg-white/80 border border-slate-100 px-4 py-3 shadow-sm flex items-center justify-between"
              >
                <div>
                  <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
                    {item.label}
                  </p>
                  <p className="text-lg font-semibold text-slate-900">
                    {item.value}
                  </p>
                  <p className="text-[11px] text-slate-500">{item.trend}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* TARJETAS SUPERIORES (MÓDULOS PRINCIPALES) */}
        <section className="grid gap-6 md:grid-cols-3">
          {/* Agenda de hoy */}
          <div className="rounded-3xl bg-white shadow-[0_10px_35px_rgba(15,23,42,0.08)] border border-slate-100 p-6 flex flex-col justify-between hover:shadow-[0_14px_45px_rgba(15,23,42,0.12)] transition cursor-default">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700 border border-sky-100">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-sky-100 text-[11px] font-semibold">
                  H
                </span>
                <span>Agenda de hoy</span>
              </div>

              <p className="mt-4 text-sm text-slate-600 leading-relaxed">
                No hay citas registradas para hoy aún. Mantén tu agenda
                actualizada para organizar mejor tus atenciones y evitar
                traslapes de horarios.
              </p>
            </div>

            <Link
              to="/veterinario/agenda"
              className="mt-5 self-start text-xs font-semibold text-sky-600 hover:text-blue-700 transition"
            >
              Ir a mi agenda →
            </Link>
          </div>

          {/* Mascotas y clientes */}
          <div className="rounded-3xl bg-white shadow-[0_10px_35px_rgba(15,23,42,0.08)] border border-slate-100 p-6 flex flex-col justify-between hover:shadow-[0_14px_45px_rgba(15,23,42,0.12)] transition cursor-default">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 border border-blue-100">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-[11px] font-semibold">
                  M
                </span>
                <span>Mascotas y clientes</span>
              </div>

              <p className="mt-4 text-sm text-slate-600 leading-relaxed">
                Gestiona las mascotas que atiendes y sus dueños desde un solo
                lugar. Más adelante podrás filtrar por especie, edad, estado de
                salud y frecuencia de controles.
              </p>
            </div>

            <Link
              to="/veterinario/mascotas"
              className="mt-5 self-start text-xs font-semibold text-sky-600 hover:text-blue-700 transition"
            >
              Ver listado de mascotas →
            </Link>
          </div>

          {/* Resumen de citas */}
          <div className="rounded-3xl bg-white shadow-[0_10px_35px_rgba(15,23,42,0.08)] border border-slate-100 p-6 flex flex-col justify-between hover:shadow-[0_14px_45px_rgba(15,23,42,0.12)] transition cursor-default">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700 border border-slate-200">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold">
                  R
                </span>
                <span>Resumen de citas</span>
              </div>

              <p className="mt-4 text-sm text-slate-600 leading-relaxed">
                Visualiza un resumen general de tus reservas: confirmadas,
                canceladas y atendidas. Ideal para tener una foto rápida de tu
                carga de trabajo durante la semana.
              </p>
            </div>

            <Link
              to="/veterinario/citas"
              className="mt-5 self-start text-xs font-semibold text-sky-600 hover:text-blue-700 transition"
            >
              Ver estadísticas básicas →
            </Link>
          </div>
        </section>

        {/* BLOQUES INFERIORES */}
        <section className="grid gap-6 md:grid-cols-2">
          {/* Próximas citas (timeline simple) */}
          <div className="rounded-3xl bg-white border border-slate-100 shadow-[0_8px_25px_rgba(15,23,42,0.06)] p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Próximas citas
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Vista rápida de lo que viene en tu agenda profesional.
                </p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-3 py-1 text-[11px] font-medium text-sky-700 border border-sky-100">
                <CalendarDays className="h-3.5 w-3.5" />
                Hoy
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {proximasCitas.map((cita, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-3 py-3 text-sm"
                >
                  <div className="mt-0.5">
                    {cita.estado === "libre" ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : cita.estado === "alerta" ? (
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                    ) : (
                      <Clock className="h-4 w-4 text-sky-500" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">
                      {cita.hora} · {cita.paciente}
                    </p>
                    <p className="text-xs text-slate-500">{cita.detalle}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <p className="text-[11px] text-slate-400">
                *Este módulo se conectará a tu agenda real y mostrará las citas por día.*
              </p>
              <Link
                to="/veterinario/agenda"
                className="text-[11px] font-semibold text-sky-600 hover:text-blue-700 transition"
              >
                Ver detalle →
              </Link>
            </div>
          </div>

          {/* Notas y recordatorios */}
          <div className="rounded-3xl bg-white border border-slate-100 shadow-[0_8px_25px_rgba(15,23,42,0.06)] p-6 flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <NotebookPen className="h-4 w-4 text-sky-500" />
                Notas y recordatorios
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Usa este espacio como referencia conceptual para futuros módulos
                de notas internas, recordatorios o acuerdos relacionados con tu
                agenda y pacientes.
              </p>
            </div>

            <p className="mt-4 text-[11px] text-slate-400">
              *Más adelante podrás vincular estas notas a citas y pacientes
              específicos dentro del sistema.*
            </p>
          </div>
        </section>
      </div>
    </LayoutVet>
  );
}
