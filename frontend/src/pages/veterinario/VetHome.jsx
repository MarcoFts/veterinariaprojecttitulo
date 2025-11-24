import LayoutVet from "../../components/layout/LayoutVet";

export default function VetHome() {
  return (
    <LayoutVet>
      <div className="space-y-6">
        {/* Encabezado */}
        <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.25em] text-sky-600 uppercase mb-1">
              VetCare · Veterinario
            </p>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
              Panel del profesional
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Administra tu agenda, revisa las próximas citas y organiza las
              mascotas que atiendes desde un solo lugar.
            </p>
          </div>

          <div className="flex gap-2 justify-end">
            <button className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs md:text-sm font-medium text-slate-700 hover:bg-slate-50">
              Ver agenda completa
            </button>
            <button className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2 text-xs md:text-sm font-semibold text-white shadow-md hover:shadow-lg hover:opacity-95 transition">
              Actualizar disponibilidad
            </button>
          </div>
        </section>

        {/* Tarjetas de resumen */}
        <section className="grid gap-4 md:grid-cols-3">
          {/* Agenda de hoy */}
          <div className="rounded-2xl bg-white shadow-card border border-slate-100 p-4 flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-sky-100 text-[10px] font-semibold">
                  H
                </span>
                <span>Agenda de hoy</span>
              </div>
              <p className="mt-3 text-sm text-slate-600">
                No hay citas registradas para hoy aún.
              </p>
            </div>
            <p className="mt-4 text-[11px] text-slate-400">
              *Luego mostraremos las citas del día conectadas al backend.*
            </p>
          </div>

          {/* Mascotas / pacientes */}
          <div className="rounded-2xl bg-white shadow-card border border-slate-100 p-4 flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[10px] font-semibold">
                  M
                </span>
                <span>Mascotas y clientes</span>
              </div>
              <p className="mt-3 text-sm text-slate-600">
                Gestiona las mascotas que atiendes y sus dueños desde un solo
                lugar.
              </p>
            </div>
            <button className="mt-4 self-start text-xs font-semibold text-sky-600 hover:text-blue-700">
              Ver listado de mascotas
            </button>
          </div>

          {/* Resumen de citas */}
          <div className="rounded-2xl bg-white shadow-card border border-slate-100 p-4 flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold">
                  R
                </span>
                <span>Resumen de citas</span>
              </div>
              <p className="mt-3 text-sm text-slate-600">
                Visualiza un resumen general de tus reservas: confirmadas,
                canceladas y atendidas.
              </p>
            </div>
            <button className="mt-4 self-start text-xs font-semibold text-sky-600 hover:text-blue-700">
              Ver estadísticas básicas
            </button>
          </div>
        </section>

        {/* Bloques inferiores */}
        <section className="grid gap-4 md:grid-cols-2">
          {/* Próximas citas */}
          <div className="rounded-2xl bg-white border border-slate-100 shadow-card p-4">
            <h2 className="text-sm font-semibold text-slate-900">
              Próximas citas
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Aquí verás las próximas horas agendadas en tu agenda profesional.
            </p>
            <p className="mt-4 text-[11px] text-slate-400">
              *Este módulo se conectará al módulo de agenda y disponibilidad.*
            </p>
          </div>

          {/* Notas / recordatorios */}
          <div className="rounded-2xl bg-white border border-slate-100 shadow-card p-4">
            <h2 className="text-sm font-semibold text-slate-900">
              Notas y recordatorios
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Espacio para registrar comentarios internos, recordatorios o
              acuerdos relacionados con tu agenda y pacientes.
            </p>
          </div>
        </section>
      </div>
    </LayoutVet>
  );
}
