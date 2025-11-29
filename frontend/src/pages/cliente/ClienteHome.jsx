import { Link } from "react-router-dom";
import LayoutCliente from "../../components/layout/LayoutCliente";
import { CalendarDays, PawPrint, BarChart3 } from "lucide-react";

export default function ClienteHome() {
  return (
    <LayoutCliente>
      <div className="space-y-14">

        {/* HERO — ENCABEZADO SUPER PREMIUM */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-50 via-white to-blue-50 p-8 shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-white">
          {/* Glow decorativo */}
          <div className="absolute -top-10 -right-10 w-52 h-52 bg-sky-200/30 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-10 -left-10 w-52 h-52 bg-blue-200/30 rounded-full blur-3xl"></div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="max-w-xl">
              <p className="text-xs font-semibold tracking-[0.25em] text-sky-600 uppercase mb-2">
                Vetyon · Panel del Cliente
              </p>

              <h1 className="text-4xl font-extrabold text-slate-900 leading-tight">
                Tu espacio <span className="text-sky-600">personal</span> en Vetyon
              </h1>

              <p className="text-base text-slate-600 mt-3 leading-relaxed">
                Administra tus mascotas, revisa tus citas, agenda nuevas atenciones y mantén control total sobre su bienestar.
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <Link
                to="/citas"
                className="inline-flex items-center justify-center rounded-xl bg-white/80 backdrop-blur-md px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 hover:bg-white shadow transition"
              >
                Ver historial
              </Link>

              <Link
                to="/citas"
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg hover:opacity-95 hover:shadow-xl transition"
              >
                Reservar hora
              </Link>
            </div>
          </div>
        </section>

        {/* TARJETAS — DISEÑO NIVEL STRIPE */}
        <section className="grid gap-8 md:grid-cols-3">

          {/* PRÓXIMA CITA */}
          <div className="group rounded-3xl bg-white shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-slate-100 p-7 hover:shadow-[0_10px_35px_rgba(0,0,0,0.10)] transition-all duration-300 cursor-default">
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 border border-sky-100 text-xs font-medium text-sky-700">
                <CalendarDays size={16} />
                <span>Próxima cita</span>
              </div>

              <p className="mt-5 text-[15px] text-slate-600 leading-relaxed">
                Aún no tienes ninguna cita agendada. Mantente al día con la salud de tus mascotas.
              </p>
            </div>

            <Link
              to="/cliente/citas"
              className="text-sm font-medium text-sky-600 hover:text-blue-700 transition"
            >
              Agendar ahora →
            </Link>
          </div>

          {/* MIS MASCOTAS */}
          <div className="group rounded-3xl bg-white shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-slate-100 p-7 hover:shadow-[0_10px_35px_rgba(0,0,0,0.10)] transition-all duration-300 cursor-default">
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 border border-blue-100 text-xs font-medium text-blue-700">
                <PawPrint size={16} />
                <span>Mis mascotas</span>
              </div>

              <p className="mt-5 text-[15px] text-slate-600 leading-relaxed">
                Lleva un registro completo de tus mascotas, sus visitas y su evolución.
              </p>
            </div>

            <Link
              to="/cliente/mascotas"
              className="text-sm font-medium text-sky-600 hover:text-blue-700 transition"
            >
              Registrar mascota →
            </Link>

          </div>

          {/* RESUMEN RÁPIDO */}
          <div className="group rounded-3xl bg-white shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-slate-100 p-7 hover:shadow-[0_10px_35px_rgba(0,0,0,0.10)] transition-all duration-300 cursor-default">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1 border border-slate-200 text-xs font-medium text-slate-700">
                <BarChart3 size={16} />
                <span>Resumen rápido</span>
              </div>

              <ul className="mt-5 space-y-2 text-[15px] text-slate-700">
                <li className="flex items-center gap-2">• 0 citas este mes</li>
                <li className="flex items-center gap-2">• 0 mascotas registradas</li>
                <li className="flex items-center gap-2">• 0 recordatorios pendientes</li>
              </ul>
            </div>

            <p className="mt-6 text-[11px] text-slate-400">
              (Los datos se conectarán al backend pronto)
            </p>
          </div>

        </section>

      </div>
    </LayoutCliente>
  );
}
