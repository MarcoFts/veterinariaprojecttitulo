// src/components/layout/LayoutAdmin.jsx
import { Outlet } from "react-router-dom";
import SidebarAdmin from "./SidebarAdmin";
import NotificationBell from "../notifications/NotificationBell";
import MfaGraceBanner from "../mfa/MfaGraceBanner";
import { ShieldCheck } from "lucide-react";

export default function LayoutAdmin() {
  return (
    <div className="h-screen bg-slate-50 flex overflow-hidden">
      {/* Sidebar */}
      <SidebarAdmin />

      {/* Contenido */}
      <main className="flex-1 overflow-y-auto">
        {/* Topbar */}
        <MfaGraceBanner profilePath="/admin/perfil" />
        <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
          <div className="px-4 md:px-8 py-4">
            <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-slate-900 flex items-center justify-center shadow-md">
                  <ShieldCheck className="h-5 w-5 text-white" />
                </div>
                <div className="leading-tight">
                  <p className="text-sm font-semibold text-slate-900">
                    Panel administrador
                  </p>
                  <p className="text-xs text-slate-500 -mt-0.5">
                    Control y supervisión del sistema
                  </p>
                </div>
              </div>

              <NotificationBell />
            </div>
          </div>
        </div>

        {/* Page */}
        <div className="px-4 md:px-8 py-6">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
