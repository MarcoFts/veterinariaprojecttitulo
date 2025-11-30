import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import LayoutVet from "../../components/layout/LayoutVet";
import { UserRound, Eye } from "lucide-react";
import { getMascotas } from "../../services/api";

export default function VetPacientes() {
  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPacientes() {
      try {
        const res = await getMascotas();
        setPacientes(res.data || []);
      } catch (error) {
        console.error("Error cargando pacientes atendidos:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchPacientes();
  }, []);

  const getEdadTexto = (m) => {
    if (m.edad) return `${m.edad} años`;
    if (m.edad_aproximada) return `${m.edad_aproximada} años (aprox.)`;
    return "Edad no registrada";
  };

  const getDuenoTexto = (m) => {
    if (m.dueno_nombre) return m.dueno_nombre;
    if (m.cliente_nombre) return m.cliente_nombre;
    if (m.cliente?.nombre_completo) return m.cliente.nombre_completo;
    return "Sin datos";
  };

  return (
    <LayoutVet>
      <div className="space-y-8">
        {/* Encabezado */}
        <section>
          <p className="text-xs font-semibold tracking-[0.25em] text-sky-600 uppercase mb-1">
            Vetyon · Veterinario
          </p>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
            Pacientes atendidos
          </h1>
          <p className="text-sm text-slate-600">
            Gestiona las mascotas que atiendes y accede a sus fichas clínicas.
          </p>
        </section>

        {/* Contenido */}
        {loading ? (
          <p className="text-sm text-slate-500">Cargando pacientes...</p>
        ) : pacientes.length === 0 ? (
          <p className="text-sm text-slate-500">
            Aún no hay pacientes registrados para este veterinario.
          </p>
        ) : (
          <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {pacientes.map((m) => (
              <article
                key={m.id}
                className="bg-white rounded-3xl p-5 border border-slate-200 shadow-[0_8px_25px_rgba(15,23,42,0.06)] flex flex-col justify-between"
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className="h-10 w-10 rounded-2xl bg-sky-50 flex items-center justify-center text-sky-600">
                    <UserRound className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-lg text-slate-900">
                      {m.nombre}
                    </h2>
                    <p className="text-sm text-slate-600">
                      Especie: {m.especie || "No registrada"}
                    </p>
                    <p className="text-sm text-slate-600">
                      Edad: {getEdadTexto(m)}
                    </p>
                    <p className="text-sm text-slate-600">
                      Dueño: {getDuenoTexto(m)}
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">
                    Historia clínica #{m.id}
                  </span>
                  <Link
                    to={`/veterinario/paciente/${m.id}`}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-sky-600 hover:text-sky-700"
                    title="Ver ficha del paciente"
                  >
                    <Eye className="h-4 w-4" />
                    Ver
                  </Link>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </LayoutVet>
  );
}
