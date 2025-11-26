import LayoutVet from "../../components/layout/LayoutVet";
import { Users2 } from "lucide-react";

export default function VetPacientes() {
  return (
    <LayoutVet>
      <div className="space-y-6">
        <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <p className="text-xs font-semibold tracking-[0.25em] text-sky-600 uppercase mb-1">
              VetCare · Veterinario
            </p>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
              Mascotas y clientes
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Aquí podrás ver y gestionar las mascotas que atiendes y sus dueños.
            </p>
          </div>
        </section>

        <section className="rounded-3xl bg-white border border-slate-100 shadow-[0_8px_25px_rgba(15,23,42,0.06)] p-6 flex flex-col items-center justify-center text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600 mb-3">
            <Users2 className="h-6 w-6" />
          </div>
          <h2 className="text-sm font-semibold text-slate-900 mb-1">
            Aún no hay mascotas cargadas
          </h2>
          <p className="text-sm text-slate-600 max-w-md">
            Cuando el módulo esté conectado al backend, aquí verás el listado de
            pacientes y podrás filtrar por dueño, especie y estado.
          </p>
        </section>
      </div>
    </LayoutVet>
  );
}
