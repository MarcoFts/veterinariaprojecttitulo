import { Link } from "react-router-dom";
import LayoutCliente from "../../components/layout/LayoutCliente";
import { CalendarDays, PawPrint, BarChart3 } from "lucide-react";

export default function ClienteHome() {
  return (
    <LayoutCliente>
      <div className="space-y-10">

        {/* Encabezado */}
        <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <p className="text-xs font-semibold tracking-[0.25em] text-sky-600 uppercase mb-1">
              VetCare · Cliente
            </p>
            <h1 className="text-3xl font-bold text-slate-900">
              Hola, bienvenido a tu panel
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Gestiona tus mascotas, agenda citas y revisa tu historial.
            </p>
          </div>

          <div className="flex gap-3 justify-end">
            <Link
              to="/citas"
              className="inline-flex items-center justify-center rounded-xl bg-white/60 backdrop-blur-md px-4 py-2 text-xs md:text-sm font-medium text-slate-700 border border-slate-200 hover:bg-white/80 shadow transition"
            >
              Ver historial
            </Link>

            <Link
              to="/citas"
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2 text-xs md:text-sm font-semibold text-white shadow-md hover:shadow-lg hover:opacity-95 transition"
            >
              Reservar hora
            </Link>
          </div>
        </section>

        {/* Tarjetas principales */}
        <section className="grid gap-6 md:grid-cols-3">

          {/* Próxima cita */}
          <div className="rounded-2xl bg-white/60 backdrop-blur-md shadow-xl border border-white/50 p-5 flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/60 px-3 py-1 shadow-sm border border-sky-200 text-xs font-medium text-sky-700 backdrop-blur-md">
                <CalendarDays size={14} />
                <span>Próxima cita</span>
              </div>

              <p className="mt-4 text-sm text-slate-600">
                Aún no tienes una próxima cita agendada.
              </p>
            </div>

            <Link
              to="/cliente/citas"
              className="mt-5 self-start text-xs font-semibold text-sky-600 hover:text-blue-700 transition"
            >
              Agendar ahora
            </Link>
          </div>

          {/* Mis mascotas */}
          <div className="rounded-2xl bg-white/60 backdrop-blur-md shadow-xl border border-white/50 p-5 flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/60 px-3 py-1 shadow-sm border border-blue-200 text-xs font-medium text-blue-700 backdrop-blur-md">
                <PawPrint size={14} />
                <span>Mis mascotas</span>
              </div>

              <p className="mt-4 text-sm text-slate-600">
                Registra tus mascotas para llevar control de sus visitas.
              </p>
            </div>

            <Link
              to="/cliente/mascotas/registrar"
              className="mt-5 self-start text-xs font-semibold text-sky-600 hover:text-blue-700 transition"
            >
              Registrar mascota
            </Link>
          </div>

          {/* Resumen rápido */}
          <div className="rounded-2xl bg-white/60 backdrop-blur-md shadow-xl border border-white/50 p-5 flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/60 px-3 py-1 shadow-sm border border-slate-200 text-xs font-medium text-slate-700 backdrop-blur-md">
                <BarChart3 size={14} />
                <span>Resumen rápido</span>
              </div>

              <ul className="mt-4 space-y-1 text-sm text-slate-600">
                <li>• 0 citas este mes.</li>
                <li>• 0 mascotas registradas.</li>
                <li>• 0 recordatorios pendientes.</li>
              </ul>
            </div>

            <p className="mt-4 text-[11px] text-slate-400">
              *Datos conectados al backend en el futuro.*
            </p>
          </div>
        </section>

      </div>
    </LayoutCliente>
  );
}
