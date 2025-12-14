import { Outlet } from "react-router-dom";
import SidebarAdmin from "./SidebarAdmin";

export default function LayoutAdmin() {
  return (
    <div className="h-screen bg-slate-50 flex overflow-hidden">
      {/* Sidebar */}
      <SidebarAdmin />

      {/* Contenido */}
      <main className="flex-1 px-4 md:px-8 py-6 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
