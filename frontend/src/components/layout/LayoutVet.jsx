import React from "react";
import SidebarVet from "./SidebarVet";

export default function LayoutVet({ children }) {
  return (
    <div className="h-screen bg-slate-50 flex overflow-hidden">
      {/* Sidebar */}
      <SidebarVet />

      {/* Contenido */}
      <main className="flex-1 px-4 md:px-8 py-6 overflow-y-auto">
        <div className="max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
