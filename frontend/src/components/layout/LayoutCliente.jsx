// src/components/layout/LayoutCliente.jsx
import React from "react";
import NavbarCliente from "./NavbarCliente";
import NotificationBell from "../notifications/NotificationBell";

export default function LayoutCliente({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100 overflow-visible">
      <NavbarCliente />

      {/* Topbar suave (dentro de cliente) */}
      <div className="sticky top-0 z-30 bg-gradient-to-b from-slate-50/90 to-transparent backdrop-blur">
        <div className="px-4 md:px-6 pt-3">
          <div className="max-w-6xl mx-auto flex justify-end">
            <NotificationBell />
          </div>
        </div>
      </div>

      <main className="px-4 md:px-6 pt-1 pb-6">
        <div className="max-w-6xl mx-auto w-full">{children}</div>
      </main>
    </div>
  );
}
