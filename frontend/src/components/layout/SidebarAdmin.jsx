// src/components/layout/SidebarAdmin.jsx
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ClipboardList,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { logout } from "../../auth";

export default function SidebarAdmin() {
  const navigate = useNavigate();

  const cerrarSesion = () => {
    logout();
    navigate("/seleccion-login", { replace: true });
  };

  const linkClass = ({ isActive }) =>
    `w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all
     ${
       isActive
         ? "bg-slate-100 text-slate-900 border border-slate-200 shadow-sm"
         : "text-slate-600 hover:bg-slate-50"
     }`;

  return (
    <aside className="hidden md:flex flex-col bg-white/95 backdrop-blur-sm border-r border-slate-200 h-full w-64">
      <div className="flex flex-col h-full">
        {/* TOP */}
        <div className="flex items-center px-4 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-slate-900 flex items-center justify-center shadow-md">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-900">Vetyon</p>
              <p className="text-xs text-slate-500 -mt-0.5">
                Panel Administrador
              </p>
            </div>
          </div>
        </div>

        {/* MENU */}
        <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
          <NavLink to="/admin/home" className={linkClass}>
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </NavLink>

          <NavLink to="/admin/inventario" className={linkClass}>
            <Package className="h-4 w-4" />
            Inventario
          </NavLink>

          {/* Movimientos queda preparado pero NO obligatorio */}
          <NavLink to="/admin/movimientos" className={linkClass}>
            <ClipboardList className="h-4 w-4" />
            Movimientos
          </NavLink>
        </nav>

        {/* FOOTER */}
        <div className="border-t border-slate-100 px-3 py-4">
          <button
            onClick={cerrarSesion}
            className="w-full flex items-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </div>
      </div>
    </aside>
  );
}
