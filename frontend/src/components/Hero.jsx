import { Link } from 'react-router-dom';

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Fondo degradado */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white to-roseC/40" />

      <div className="max-w-6xl mx-auto px-4 py-20 md:py-28 grid md:grid-cols-2 items-center gap-10">
        {/* Columna izquierda: texto principal */}
        <div>
          <span className="inline-block px-3 py-1 rounded-full bg-roseC text-roseA font-semibold text-xs mb-4">
            VetCare — Gestión Veterinaria Digital
          </span>

          <h1 className="font-display text-4xl md:text-6xl font-extrabold leading-tight">
            Moderniza tu <span className="text-roseA">clínica veterinaria</span><br />con un sistema integral
          </h1>

          <p className="mt-4 text-lg text-black/70">
            VetCare digitaliza tus procesos clínicos, administrativos y comunicacionales. 
            Gestiona citas, fichas electrónicas, inventario, reportes y recordatorios automáticos 
            desde una plataforma segura y fácil de usar.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/registro"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-roseA to-roseB text-white shadow-soft"
            >
              Comenzar
              <span aria-hidden>→</span>
            </Link>

            <a
              href="#funciones"
              className="px-5 py-3 rounded-full border border-roseA/30 hover:border-roseA"
            >
              Ver funcionalidades
            </a>
          </div>

          <p className="mt-4 text-sm text-black/60">
            Simplifica la gestión, mejora la atención y lleva tu clínica al siguiente nivel.
          </p>
        </div>

        {/* Columna derecha: ilustración / demo */}
        <div className="relative">
          <div className="aspect-video rounded-[var(--radius)] bg-white shadow-xl border border-white overflow-hidden">
            {/* Imagen o ilustración temporal */}
            <div className="w-full h-full bg-gradient-to-br from-roseC via-white to-roseB/30 grid place-items-center">
              <span className="font-display text-3xl text-roseA">VetCare</span>
            </div>
          </div>

          {/* Tarjeta flotante de ejemplo */}
          <div className="absolute -bottom-6 -left-6 hidden md:block">
            <div className="rounded-2xl bg-white p-4 shadow-xl border">
              <p className="text-sm font-semibold">Citas agendadas hoy</p>
              <p className="text-roseA font-bold text-2xl">12</p>
              <p className="text-xs text-black/50 mt-1">Recordatorios automáticos enviados ✅</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
