import { Link } from "react-router-dom";
import LayoutVet from "../../components/layout/LayoutVet";
import { Users2, PawPrint, User2 } from "lucide-react";

export default function VetPacientes() {
  // MOCK TEMPORAL — cuando haya backend se reemplaza con fetch
  const pacientes = [
    {
      id: 1,
      nombre: "Luna",
      especie: "Gato",
      edad: "3 años",
      dueño: "Juan Pérez",
    },
    {
      id: 2,
      nombre: "Rocky",
      especie: "Perro",
      edad: "5 años",
      dueño: "María Torres",
    },
    {
      id: 3,
      nombre: "Nala",
      especie: "Perro",
      edad: "2 años",
      dueño: "Carla Muñoz",
    },
  ];

  return (
    <LayoutVet>
      <div className="space-y-8">

        {/* ENCABEZADO */}
        <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <p className="text-xs font-semibold tracking-[0.25em] text-sky-600 uppercase mb-1">
              Vetyon · Veterinario
            </p>

            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
              Pacientes atendidos
            </h1>

            <p className="text-sm text-slate-600 mt-1">
              Gestiona las mascotas que atiendes y accede a sus fichas clínicas.
            </p>
          </div>
        </section>

        {/* LISTADO PREMIUM */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {pacientes.map((p) => (
            <Link
              key={p.id}
              to={`/veterinario/paciente/${p.id}`}
              className="
                group bg-white rounded-3xl border border-slate-100 
                p-6 shadow-[0_8px_25px_rgba(15,23,42,0.06)]
                hover:shadow-[0_10px_28px_rgba(15,23,42,0.12)]
                hover:border-sky-200
                transition-all duration-200 cursor-pointer
                flex flex-col gap-4
              "
            >
              {/* ICONO */}
              <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner">
                <PawPrint className="h-6 w-6" />
              </div>

              {/* NOMBRE */}
              <h3 className="text-xl font-semibold text-slate-900 group-hover:text-sky-700 transition">
                {p.nombre}
              </h3>

              {/* INFO */}
              <div className="space-y-1 text-sm text-slate-600">
                <p>
                  <span className="font-medium text-slate-800">Especie:</span>{" "}
                  {p.especie}
                </p>
                <p>
                  <span className="font-medium text-slate-800">Edad:</span>{" "}
                  {p.edad}
                </p>
                <p className="flex items-center gap-1">
                  <User2 className="h-4 w-4 text-sky-600" />
                  <span className="font-medium text-slate-800">Dueño:</span>{" "}
                  {p.dueño}
                </p>
              </div>

              {/* BOTÓN VER FICHA */}
              <div>
                <span className="inline-block text-sm font-semibold text-sky-600 group-hover:underline">
                  Ver ficha clínica →
                </span>
              </div>
            </Link>
          ))}
        </section>

        {/* SI NO HAY PACIENTES */}
        {pacientes.length === 0 && (
          <section className="rounded-3xl bg-white border border-slate-100 shadow-[0_8px_25px_rgba(15,23,42,0.06)] p-6 flex flex-col items-center justify-center text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600 mb-3">
              <Users2 className="h-6 w-6" />
            </div>

            <h2 className="text-sm font-semibold text-slate-900 mb-1">
              Aún no hay pacientes registrados
            </h2>

            <p className="text-sm text-slate-600 max-w-md">
              Cuando el módulo esté conectado al backend, aquí aparecerán los
              pacientes asociados a tus consultas y podrás acceder a sus fichas
              clínicas detalladas.
            </p>
          </section>
        )}
      </div>
    </LayoutVet>
  );
}
