import { Link } from "react-router-dom";

export default function SeleccionLogin() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col md:flex-row">

        {/* IZQUIERDA — Degradado azul */}
        <div className="relative md:w-1/2 w-full bg-gradient-to-br from-sky-400 via-blue-500 to-blue-700 text-white p-8 md:p-12 flex flex-col justify-between">

          {/* Decoración */}
          <div className="pointer-events-none absolute inset-0 opacity-15">
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/20 blur-2xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white/10 blur-3xl" />
          </div>

          {/* Texto principal */}
          <div className="relative">
            <h1 className="text-sm font-semibold uppercase tracking-[0.2em] mb-4 text-white/80">
              Plataforma Veterinaria
            </h1>

            <h2 className="text-3xl md:text-4xl font-bold leading-tight mb-4">
              Bienvenido a VetCare
            </h2>

            <p className="text-sm md:text-base text-white/85 max-w-md">
              Una plataforma creada para facilitar la gestión diaria tanto a dueños de
              mascotas como a profesionales veterinarios. VetCare permite administrar
              citas, pacientes, historial clínico y la comunicación entre clínica y
              clientes de manera rápida, clara y moderna.
            </p>
          </div>

          <div className="relative mt-8 space-y-3 text-sm md:text-base">
            <p className="font-medium text-white/90">Con VetCare podrás:</p>
            <ul className="space-y-1 text-white/85">
              <li>• Agendar horas y revisar disponibilidad en tiempo real.</li>
              <li>• Administrar información de pacientes y mascotas.</li>
              <li>• Acceder al historial clínico y datos importantes.</li>
              <li>• Mantener comunicación clara entre clínica y clientes.</li>
            </ul>
          </div>

        </div>

        {/* DERECHA */}
        <div className="md:w-1/2 w-full p-8 md:p-12 flex flex-col justify-center">
          <div className="mb-8 text-center md:text-left">
            <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">
              ¿Cómo deseas ingresar?
            </h3>
            <p className="text-sm md:text-base text-slate-600">
              Selecciona el tipo de cuenta con el que deseas acceder.
            </p>
          </div>

          <div className="space-y-5">

            {/* CLIENTE */}
            <Link
              to="/login/cliente"
              className="group block rounded-2xl border border-slate-200 hover:border-sky-500/70 hover:shadow-lg transition-all bg-white"
            >
              <div className="p-5 md:p-6 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-50 group-hover:bg-sky-100 transition">
                  <span className="text-2xl">🐶</span>
                </div>

                <div className="flex-1 text-left">
                  <h4 className="text-base md:text-lg font-semibold text-slate-900">
                    Ingresar como Cliente
                  </h4>
                  <p className="text-xs md:text-sm text-slate-500 mt-1">
                    Agenda horas, gestiona tus mascotas y revisa tu historial.
                  </p>

                  <button
                    className="mt-3 inline-flex items-center justify-center rounded-lg px-4 py-2 text-xs md:text-sm font-semibold 
                    bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md 
                    group-hover:shadow-lg group-hover:opacity-95 transition"
                  >
                    Entrar como Cliente
                  </button>
                </div>
              </div>
            </Link>

            {/* VETERINARIO */}
            <Link
              to="/login/veterinario"
              className="group block rounded-2xl border border-slate-200 hover:border-sky-500/70 hover:shadow-lg transition-all bg-white"
            >
              <div className="p-5 md:p-6 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 group-hover:bg-blue-100 transition">
                  <span className="text-2xl">🩺</span>
                </div>

                <div className="flex-1 text-left">
                  <h4 className="text-base md:text-lg font-semibold text-slate-900">
                    Ingresar como Veterinario
                  </h4>
                  <p className="text-xs md:text-sm text-slate-500 mt-1">
                    Administra tu agenda, pacientes y panel clínico.
                  </p>

                  <button
                    className="mt-3 inline-flex items-center justify-center rounded-lg px-4 py-2 text-xs md:text-sm font-semibold 
                    bg-gradient-to-r from-blue-500 to-sky-600 text-white shadow-md 
                    group-hover:shadow-lg group-hover:opacity-95 transition"
                  >
                    Entrar como Veterinario
                  </button>
                </div>
              </div>
            </Link>

          </div>

          <p className="mt-6 text-[11px] md:text-xs text-slate-400 text-center md:text-left">
            *La autenticación real se conectará al backend en una etapa posterior.
          </p>
        </div>
      </div>
    </div>
  );
}
