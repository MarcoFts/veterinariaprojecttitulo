// src/pages/vet/vetfichaclinica.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import LayoutVet from "../../components/layout/LayoutVet";
import { Calendar, Plus, MessageSquareHeart } from "lucide-react";
import ModalAgregarRegistro from "../../components/modals/ModalAgregarRegistro";
import {
  getRegistrosClinicos,
  crearRegistroClinico,
  getMascota,
} from "../../services/api";

export default function VetFichaClinica() {
  const { id } = useParams(); // id de la mascota desde la URL
  const [openModal, setOpenModal] = useState(false);
  const [registros, setRegistros] = useState([]);
  const [mascota, setMascota] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cargar ficha clínica y datos de la mascota
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [regsRes, mascotaRes] = await Promise.all([
          getRegistrosClinicos({ mascota: id }),
          getMascota(id),
        ]);

        setRegistros(regsRes.data || []);
        setMascota(mascotaRes.data || null);
      } catch (error) {
        console.error("Error cargando ficha clínica:", error);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchData();
    }
  }, [id]);

  const handleSaveRegistro = async (payload) => {
    try {
      const res = await crearRegistroClinico({
        mascota: id,
        ...payload,
      });

      // Insertamos el nuevo registro al inicio del historial
      setRegistros((prev) => [res.data, ...prev]);
      setOpenModal(false);
    } catch (error) {
      console.error("Error creando registro clínico:", error);
    }
  };

  const nombreMascota = mascota?.nombre || "Mascota";
  const especie = mascota?.especie || "";
  const sexo = mascota?.sexo || "";
  const esterilizado =
    typeof mascota?.esterilizado === "boolean"
      ? mascota.esterilizado
        ? " · Esterilizado/a"
        : ""
      : "";

  const formatFecha = (iso) => {
    if (!iso) return "Sin fecha";
    try {
      return new Date(iso).toLocaleDateString("es-CL", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return iso;
    }
  };

  return (
    <LayoutVet>
      <div className="space-y-8">
        {/* Encabezado */}
        <section className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.25em] text-sky-600 uppercase mb-1">
              Vetyon · Ficha clínica
            </p>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
              Ficha clínica de {nombreMascota}
            </h1>
            <p className="text-sm text-slate-600">
              Aquí podrás ver el historial clínico de la mascota.
            </p>
          </div>

          <button
            onClick={() => setOpenModal(true)}
            className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md transition"
          >
            <Plus className="h-5 w-5" />
            Nuevo registro
          </button>
        </section>

        {/* Información de la mascota */}
        <section className="bg-white rounded-3xl p-6 border border-slate-200 shadow-[0_8px_25px_rgba(15,23,42,0.06)]">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <MessageSquareHeart className="h-7 w-7" />
            </div>

            <div>
              <h2 className="font-bold text-lg text-slate-900">
                {nombreMascota}
              </h2>
              <p className="text-sm text-slate-600">
                {[especie, sexo, esterilizado].filter(Boolean).join(" · ") ||
                  "Datos clínicos no registrados"}
              </p>
            </div>
          </div>
        </section>

        {/* Timeline / Historial clínico */}
        <section className="bg-white rounded-3xl p-6 border border-slate-200 shadow-[0_8px_25px_rgba(15,23,42,0.06)] space-y-8">
          <h3 className="text-xl font-semibold text-slate-900">
            Historial clínico
          </h3>

          {loading ? (
            <p className="text-sm text-slate-500">Cargando historial...</p>
          ) : registros.length === 0 ? (
            <p className="text-sm text-slate-500">
              Aún no hay registros clínicos para esta mascota.
            </p>
          ) : (
            <div className="relative border-l-2 border-sky-200 ml-4 space-y-10">
              {registros.map((item) => (
                <div key={item.id} className="relative pl-8">
                  {/* Punto del timeline */}
                  <div className="absolute -left-[10px] top-1 h-4 w-4 rounded-full bg-sky-600 shadow shadow-sky-600/30" />

                  <div className="bg-slate-50 hover:bg-white transition rounded-2xl p-5 border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 text-sky-700 font-semibold">
                      <Calendar className="h-4 w-4" />
                      {formatFecha(item.fecha)}
                    </div>
                    {item.motivo_consulta && (
                      <>
                        <p className="font-semibold text-slate-900 mt-2">
                          Motivo de la consulta:
                        </p>
                        <p className="text-slate-700">
                          {item.motivo_consulta}
                        </p>
                      </>
                    )}
                    {item.diagnostico && (
                      <>
                        <p className="font-semibold text-slate-900 mt-2">
                          Diagnóstico:
                        </p>
                        <p className="text-slate-700">{item.diagnostico}</p>
                      </>
                    )}

                    {item.tratamientos && (
                      <>
                        <p className="font-semibold text-slate-900 mt-3">
                          Tratamientos:
                        </p>
                        <p className="text-slate-700">{item.tratamientos}</p>
                      </>
                    )}

                    {item.medicamentos && (
                      <>
                        <p className="font-semibold text-slate-900 mt-3">
                          Medicamentos:
                        </p>
                        <p className="text-slate-700">{item.medicamentos}</p>
                      </>
                    )}

                    {item.evolucion && (
                      <>
                        <p className="font-semibold text-slate-900 mt-3">
                          Evolución:
                        </p>
                        <p className="text-slate-700">{item.evolucion}</p>
                      </>
                    )}

                    {item.notas && (
                      <>
                        <p className="font-semibold text-slate-900 mt-3">
                          Notas:
                        </p>
                        <p className="text-slate-700">{item.notas}</p>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Modal para crear nuevo registro clínico */}
      <ModalAgregarRegistro
        open={openModal}
        onClose={() => setOpenModal(false)}
        onSave={handleSaveRegistro}
      />
    </LayoutVet>
  );
}
