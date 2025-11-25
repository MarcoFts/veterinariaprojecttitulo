import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Home, CalendarDays, PawPrint, UserCircle2 } from "lucide-react";
import { logout } from "../../auth"; // <-- ajusta la ruta si tu auth.js está en otro lado

const navLinks = [
  { label: "Inicio", href: "/cliente/home", icon: Home },
  { label: "Mis citas", href: "/cliente/citas", icon: CalendarDays },
  { label: "Mis mascotas", href: "/cliente/mascotas", icon: PawPrint },
];

export default function NavbarCliente() {
  const location = useLocation();
  const navigate = useNavigate();
  const [openUserMenu, setOpenUserMenu] = useState(false);

  // Activo si coincide exacto
  const isActive = (href) => location.pathname === href;

  const handleLogout = () => {
    logout();                 // borra access y refresh del localStorage
    setOpenUserMenu(false);   // cierra el menú
    navigate("/login", { replace: true }); // redirige al login
  };

  return (
    <header className="sticky top-0 z-40 bg-white/40 backdrop-blur-xl border-b border-white/30 shadow-sm">
      <nav className="max-w-6xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between gap-4">
        {/* LOGO */}
        <Link to="/cliente/home" className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-sky-400 via-blue-500 to-blue-600 flex items-center justify-center shadow-md">
            <span className="text-white text-sm font-bold">VC</span>
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-slate-900">VetCare</p>
            <p className="text-xs text-slate-500">Panel Cliente</p>
          </div>
        </Link>

        {/* Navegación Desktop */}
        <ul className="hidden md:flex items-center gap-3 text-sm font-medium">
          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  to={item.href}
                  className={`px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 transition-all ${
                    isActive(item.href)
                      ? "bg-white/70 backdrop-blur-md text-blue-700 shadow-sm border border-sky-300"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/40"
                  }`}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Botón + Usuario */}
        <div className="flex items-center gap-3">
          {/* Reservar hora debe ir a /cliente/citas */}
          <Link
            to="/cliente/citas"
            className="hidden md:inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2 text-xs md:text-sm font-semibold text-white shadow-md hover:shadow-lg hover:opacity-95 transition"
          >
            Reservar hora
          </Link>

          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenUserMenu((prev) => !prev)}
              className="flex items-center gap-2 rounded-full border border-white/40 bg-white/60 backdrop-blur-md px-3 py-1.5 text-xs md:text-sm hover:bg-white/80 shadow-sm transition"
            >
              <div className="h-7 w-7 rounded-full bg-sky-100 flex items-center justify-center">
                <UserCircle2 size={18} className="text-sky-700" />
              </div>
              <span className="hidden md:inline text-slate-700">
                Cliente VetCare
              </span>
            </button>

            {openUserMenu && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-100 bg-white/80 backdrop-blur-md shadow-xl text-xs md:text-sm overflow-hidden">
                <button className="w-full text-left px-3 py-2 hover:bg-white/60 transition">
                  Mi perfil{" "}
                  <span className="text-[10px] text-slate-400">(futuro)</span>
                </button>

                {/* ✅ LOGOUT REAL */}
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 hover:bg-white/60 transition"
                >
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
