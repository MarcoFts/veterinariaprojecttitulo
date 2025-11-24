import { useState } from "react";
import {
  Home,
  CalendarDays,
  PawPrint,
  ClipboardList,
  Settings,
  User,
  Stethoscope,
} from "lucide-react";

const sections = [
  { id: "home", label: "Inicio", description: "Resumen general", icon: Home },
  { id: "agenda", label: "Agenda", description: "Disponibilidad y horas", icon: CalendarDays },
  { id: "pacientes", label: "Mascotas", description: "Mascotas y dueños", icon: PawPrint },
  { id: "citas", label: "Citas", description: "Historial de reservas", icon: ClipboardList },
  { id: "config", label: "Preferencias", description: "Datos y ajustes", icon: Settings },
];

export default function SidebarVet() {
  const [activeId, setActiveId] = useState("home");

  return (
    <aside
      className="
        hidden md:flex flex-col 
        bg-white/95 backdrop-blur-sm shadow-sm border-r border-slate-200 
        h-full w-64
      "
    >
      {/* ESTRUCTURA SUPERIOR → MENÚ → FOOTER */}
      <div className="flex flex-col h-full">
        {/* TOP (LOGO) */}
        <div className="flex items-center px-4 py-4 border-b border-slate-100">
          {/* LOGO ICON */}
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-sky-400 via-blue-500 to-blue-600 flex items-center justify-center shadow-md">
              <Stethoscope size={22} strokeWidth={2.2} className="text-white" />
            </div>

            {/* TEXTO DEL LOGO */}
            <div className="origin-left">
              <p className="text-sm font-semibold text-slate-900">VetCare</p>
              <p className="text-xs text-slate-500 -mt-0.5">Panel Veterinario</p>
            </div>
          </div>
        </div>

        {/* MENÚ CENTRADO VERTICALMENTE */}
        <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1 flex flex-col">
          <div className="flex flex-col gap-1">
            {sections.map((item) => {
              const Icon = item.icon;
              const isActive = item.id === activeId;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveId(item.id)}
                  className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-all duration-150 ${
                    isActive
                      ? "bg-sky-50 text-sky-700 border border-sky-200 shadow-sm"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {/* ICONO */}
                  <div className="flex items-center justify-center h-8 w-8 shrink-0">
                    <Icon
                      size={20}
                      className={isActive ? "text-sky-700" : "text-slate-600"}
                    />
                  </div>

                  {/* TEXTO */}
                  <div className="flex flex-col overflow-hidden">
                    <span className="font-medium">{item.label}</span>
                    <span className="text-[11px] text-slate-500">{item.description}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </nav>

        {/* FOOTER PEGADO ABAJO */}
        <div className="border-t border-slate-100 px-3 py-4">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="h-8 w-8 rounded-full bg-sky-100 flex items-center justify-center">
              <User size={16} className="text-sky-700" />
            </div>

            {/* TEXTO FOOTER */}
            <div>
              <p className="text-xs font-semibold text-slate-800">Veterinario</p>
              <p className="text-[11px] text-slate-500 -mt-0.5">
                Gestión de agenda y citas
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
