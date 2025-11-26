import LayoutVet from "../../components/layout/LayoutVet";
import { Users2, Search, Filter, PawPrint, ChevronRight } from "lucide-react";

export default function VetMascotas() {
  // Lista vacía por ahora (futuro backend)
  const mascotas = [];

  return (
    <LayoutVet>
      <div className="space-y-10">

        {/* HERO PREMIUM */}
        <section>
          <p className="text-xs font-semibold tracking-[0.25em] text-sky-600 uppercase mb-1">
            VetCare · Veterinario
          </p>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900">
            Mascotas y clientes
          </h1>
          <p className="text-sm md:text-base text-slate-600 mt-2 max-w-2xl">
            Administra y revisa el listado de pacientes que atiendes en tu consulta.
            Próximamente podrás filtrar por dueño, especie, estado y más.
          </p>
        </section>

        {/* BARRA DE BUSQUEDA + FILTRO */}
        <section className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Buscador */}
          <div className="relative w-full md:w-1/2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar mascota o dueño..."
              className="w-full rounded-xl border border-slate-200 bg-white px-10 py-2 text-sm shadow-sm focus:border-sky-500 focus:ring-sky-500 transition"
            />
          </div>

          {/* Botón filtro */}
          <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm transition">
            <Filter className="w-4 h-4" />
            Filtros
          </button>
        </section>

        {/* LISTADO O PLACEHOLDER */}
        {mascotas.length === 0 ? (
          /* PLACEHOLDER PREMIUM */
          <section className="rounded-3xl bg-white shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-slate-100 p-10 flex flex-col items-center text-center mx-auto max-w-3xl">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600 mb-4">
              <Users2 className="w-8 h-8" />
            </div>

            <h2 className="text-lg font-semibold text-slate-900 mb-1">
              Aún no hay mascotas cargadas
            </h2>
            <p className="text-sm text-slate-600 max-w-md leading-relaxed">
              Cuando este módulo esté conectado al backend, aquí verás el listado
              completo de pacientes, junto con dueños asociados, especie, edad,
              notas médicas y más.
            </p>
          </section>
        ) : (
          /* LISTA DE MASCOTAS ULTRA PREMIUM */
          <section className="grid gap-4">
            {mascotas.map((m) => (
              <div
                key={m.id}
                className="rounded-2xl bg-white p-5 border border-slate-200 shadow-sm hover:shadow-md transition cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-sky-50 flex items-center justify-center">
                    <PawPrint className="w-6 h-6 text-sky-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">
                      {m.nombre}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {m.especie} · Dueño: {m.dueno}
                    </p>
                  </div>
                </div>

                <ChevronRight className="text-slate-400 w-5 h-5" />
              </div>
            ))}
          </section>
        )}
      </div>
    </LayoutVet>
  );
}
