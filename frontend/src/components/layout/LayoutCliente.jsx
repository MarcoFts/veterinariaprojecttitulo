import React from "react";
import NavbarCliente from "./NavbarCliente";

export default function LayoutCliente({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100 overflow-visible">
      <NavbarCliente />
      <main className="px-4 md:px-6 pt-1 pb-6">

        <div className="max-w-6xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
