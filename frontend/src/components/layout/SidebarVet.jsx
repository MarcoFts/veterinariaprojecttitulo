import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Home,
  CalendarDays,
  PawPrint,
  ClipboardList,
  Settings,
  User,
  Stethoscope,
  LogOut,
  Users2,
} from "lucide-react";
import { logout } from "../../auth";

const sections = [
  { id: "home", label: "Inicio", description: "Resumen general", icon: Home },
  {
    id: "agenda",
    label: "Agenda",
    description: "Disponibilidad y horas",
    icon: CalendarDays,
  },
  {
    id: "agenda-dia",
    label: "Agenda del día",
    description: "Citas del día",
    icon: CalendarDays,
  },
  {
    id: "pacientes",
    label: "Pacientes",
    description: "Fichas clínicas",
    icon: Users2,
  },
  {
    id: "citas",
    label: "Citas",
    description: "Historial de reservas",
    icon: ClipboardList,
  },
  {
    id: "config",
    label: "Preferencias",
    description: "Datos y ajustes",
    icon: Settings,
  },
];

export default function SidebarVet() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login/veterinario", { replace: true });
  };

  const isActive = (id) => location.pathname === `/veterinario/${id}`;

  return (
    <aside
      className="
      hidden md:flex flex-col 
      bg-white/95 backdrop-blur-sm shadow-sm border-r border-slate-200 
      h-full w-64
    "
    >
      <div className="flex flex-col h-full">
        {/* TOP */}
        <div className="flex items-center px-4 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-sky-400 via-blue-500 to-blue-600 flex items-center justify-center shadow-md">
              <Stethoscope size={22} strokeWidth={2.2} className="text-white" />
            </div>

            <div className="origin-left">
              <p className="text-sm font-semibold text-slate-900">Vetyon</p>
              <p className="text-xs text-slate-500 -mt-0.5">Panel Veterinario</p>
            </div>
          </div>
        </div>

        {/* MENU */}
        <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1 flex flex-col">
          {sections.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.id);

            return (
              <Link
                key={item.id}
                to={`/veterinario/${item.id}`}
                className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-all duration-150 ${
                  active
                    ? "bg-sky-50 text-sky-700 border border-sky-200 shadow-sm"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-center h-8 w-8 shrink-0">
                  <Icon
                    size={20}
                    className={active ? "text-sky-700" : "text-slate-600"}
                  />
                </div>

                <div className="flex flex-col overflow-hidden">
                  <span className="font-medium">{item.label}</span>
                  <span className="text-[11px] text-slate-500">
                    {item.description}
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* FOOTER */}
        <div className="border-t border-slate-100 px-3 py-4 space-y-3">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="h-8 w-8 rounded-full bg-sky-100 flex items-center justify-center">
              <User size={16} className="text-sky-700" />
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-800">Veterinario</p>
              <p className="text-[11px] text-slate-500 -mt-0.5">
                Gestión de agenda y citas
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition"
          >
            <LogOut size={16} />
            Cerrar sesión
          </button>
        </div>
      </div>
    </aside>
  );
}
