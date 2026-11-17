// src/components/layout/LayoutVet.jsx
import React from "react";
import SidebarVet from "./SidebarVet";
import NotificationBell from "../notifications/NotificationBell";
import MfaGraceBanner from "../mfa/MfaGraceBanner";
import { Stethoscope } from "lucide-react";

export default function LayoutVet({ children }) {
  return (
    <div className="h-screen bg-slate-50 flex overflow-hidden">
      {/* Sidebar */}
      <SidebarVet />

      {/* Contenido */}
      <main className="flex-1 overflow-y-auto">
        {/* Topbar */}
        <MfaGraceBanner profilePath="/veterinario/perfil" />
        <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
          <div className="px-4 md:px-8 py-4">
            <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-slate-900 flex items-center justify-center shadow-md">
                  <Stethoscope className="h-5 w-5 text-white" />
                </div>
                <div className="leading-tight">
                  <p className="text-sm font-semibold text-slate-900">
                    Panel veterinario
                  </p>
                  <p className="text-xs text-slate-500 -mt-0.5">
                    Agenda, pacientes y registros
                  </p>
                </div>
              </div>

              <NotificationBell />
            </div>
          </div>
        </div>

        {/* Page */}
        <div className="px-4 md:px-8 py-6">
          <div className="max-w-6xl mx-auto">{children}</div>
        </div>
      </main>
    </div>
  );
}
