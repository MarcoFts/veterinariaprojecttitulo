import { useNavigate } from "react-router-dom";
import { User, Stethoscope, Shield } from "lucide-react";

export default function SeleccionLogin() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
      <div className="w-full max-w-6xl min-h-[560px] bg-white rounded-3xl shadow-2xl border border-slate-200 grid grid-cols-1 md:grid-cols-2 overflow-hidden">

        {/* PANEL IZQUIERDO – HERO PREMIUM */}
        <div className="relative p-10 flex flex-col justify-between bg-gradient-to-br from-sky-500 via-sky-600 to-blue-700 text-white">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_left,white,transparent_60%)]" />

          <div className="relative z-10">
            <p className="text-xs font-semibold tracking-widest uppercase opacity-80">
              Plataforma veterinaria
            </p>

            <h1 className="text-4xl font-bold mt-4 leading-tight">
              Bienvenido a <br /> Vetyon
            </h1>

            <p className="text-sm mt-5 max-w-sm opacity-90 leading-relaxed">
              Gestiona citas, pacientes e inventario desde una plataforma
              moderna, clara y profesional.
            </p>
          </div>

          <ul className="relative z-10 text-sm space-y-3 opacity-90">
            <li className="flex items-center gap-2">• Inventario centralizado</li>
            <li className="flex items-center gap-2">• Control de stock y vencimientos</li>
            <li className="flex items-center gap-2">• Acceso seguro por roles</li>
          </ul>
        </div>

        {/* PANEL DERECHO */}
        <div className="p-10 flex flex-col justify-center gap-8">

          <div>
            <h2 className="text-2xl font-semibold text-slate-900">
              ¿Cómo deseas ingresar?
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              Selecciona el tipo de cuenta.
            </p>
          </div>

          {/* CLIENTE */}
          <div className="group rounded-2xl border border-slate-200 p-5 flex items-center justify-between transition-all hover:border-sky-300 hover:shadow-md">
            <div className="flex items-center gap-4">
              <div className="h-11 w-11 rounded-xl bg-sky-100 flex items-center justify-center">
                <User className="h-5 w-5 text-sky-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-sm">
                  Ingresar como Cliente
                </p>
                <p className="text-xs text-slate-500">
                  Agenda horas y gestiona tus mascotas.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate("/login/cliente")}
              className="rounded-xl bg-sky-600 px-8 py-2 text-xs font-semibold text-white hover:bg-sky-700 min-w-[140px]"
            >
              Entrar
            </button>
          </div>

          {/* VETERINARIO */}
          <div className="group rounded-2xl border border-slate-200 p-5 flex items-center justify-between transition-all hover:border-emerald-300 hover:shadow-md">
            <div className="flex items-center gap-4">
              <div className="h-11 w-11 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Stethoscope className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-sm">
                  Ingresar como Veterinario
                </p>
                <p className="text-xs text-slate-500">
                  Agenda, pacientes e historial clínico.
                </p>
              </div>
              
            </div>
            <button
              onClick={() => navigate("/login/veterinario")}
              className="rounded-xl bg-emerald-600 px-8 py-2 text-xs font-semibold text-white hover:bg-emerald-700 min-w-[140px]"
            >
              Entrar
            </button>
          </div>

          {/* ADMINISTRADOR */}
          <div className="group rounded-2xl border border-slate-200 p-5 flex items-center justify-between transition-all hover:border-slate-400 hover:shadow-md">
            <div className="flex items-center gap-4">
              <div className="h-11 w-11 rounded-xl bg-slate-200 flex items-center justify-center">
                <Shield className="h-5 w-5 text-slate-700" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-sm">
                  Ingresar como Administrador
                </p>
                <p className="text-xs text-slate-500">
                  Gestión de inventario y control del sistema.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate("/login/admin")}
              className="rounded-xl bg-slate-800 px-8 py-2 text-xs font-semibold text-white hover:bg-slate-900 min-w-[140px]"
            >
              Entrar
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
