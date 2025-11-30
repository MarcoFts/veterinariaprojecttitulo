// src/pages/veterinario/VetFichaClinica.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import LayoutVet from "../../components/layout/LayoutVet";
import {
  Calendar,
  MessageSquareHeart,
  UserRound,
  Phone,
  Mail,
  FileText,
} from "lucide-react";
import ModalAgregarRegistro from "../../components/modals/ModalAgregarRegistro";
import ModalReceta from "../../components/modals/ModalReceta";
import { getRegistrosClinicos, getMascota } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

export default function VetFichaClinica() {
  const { id } = useParams(); // id de la mascota
  const [mascota, setMascota] = useState(null);
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);

  const [tab, setTab] = useState("clinico"); // "datos" | "clinico" | "vacunas" | "antiparasitarios"
  const [openModal, setOpenModal] = useState(false);

  // receta
  const [openReceta, setOpenReceta] = useState(false);
  const [registroSeleccionado, setRegistroSeleccionado] = useState(null);

  // ---------- datos del profesional logueado ----------
  const { user } = useAuth();

  const clinicaNombre =
    user?.clinica_nombre || user?.clinic_name || "Clínica Veterinaria";

  const clinicaDireccion = user?.clinica_direccion || "";

  const clinicaTelefono = user?.telefono || user?.phone || "";

  const cargarDatos = async () => {
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
  };

  useEffect(() => {
    if (id) {
      cargarDatos();
    }
  }, [id]);

  const nombreMascota = mascota?.nombre || "Mascota";
  const especie = mascota?.especie || "";
  const sexo = mascota?.sexo || "";
  const raza = mascota?.raza || "";
  const esterilizado =
    typeof mascota?.esterilizado === "boolean"
      ? mascota.esterilizado
        ? "Sí"
        : "No"
      : "No registrado";

  const duenoNombre =
    mascota?.dueno_nombre ||
    mascota?.cliente_nombre ||
    mascota?.cliente?.nombre_completo ||
    "Sin datos";

  const duenoTelefonoMascota =
    mascota?.dueno_telefono ||
    mascota?.cliente?.telefono ||
    mascota?.cliente?.phone ||
    "-";

  const duenoEmail =
    mascota?.dueno_email ||
    mascota?.cliente?.email ||
    mascota?.cliente?.correo ||
    "-";

  const fechaNacimiento =
    mascota?.fecha_nacimiento ||
    mascota?.nacimiento ||
    mascota?.fecha_nac ||
    null;

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

  // --- Helpers para Vacunas y Antiparasitarios ---

  const registrosVacunas = registros.filter((r) =>
    (r.medicamentos || "").toLowerCase().includes("vacuna:")
  );

  const registrosAntiparasitarios = registros.filter((r) =>
    (r.medicamentos || "").toLowerCase().includes("antiparasitario")
  );

  const extraerLinea = (texto, keyword) => {
    if (!texto) return "";
    const lower = keyword.toLowerCase();
    const linea =
      texto
        .split("\n")
        .find((l) => l.toLowerCase().includes(lower)) || texto;
    return linea;
  };

  const abrirReceta = (reg) => {
    setRegistroSeleccionado(reg);
    setOpenReceta(true);
  };

  // ---------- Render de pestañas ----------

  const renderTabContenido = () => {
    if (tab === "datos") {
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">
            Datos del paciente
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-slate-700">
            <p>
              <span className="font-semibold">Especie:</span>{" "}
              {especie || "No registrada"}
            </p>
            <p>
              <span className="font-semibold">Raza:</span>{" "}
              {raza || "No registrada"}
            </p>
            <p>
              <span className="font-semibold">Sexo:</span>{" "}
              {sexo || "No registrado"}
            </p>
            <p>
              <span className="font-semibold">¿Esterilizado?</span>{" "}
              {esterilizado}
            </p>
            <p>
              <span className="font-semibold">Fecha de nacimiento:</span>{" "}
              {formatFecha(fechaNacimiento)}
            </p>
          </div>
        </div>
      );
    }

    if (tab === "clinico") {
      return (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-slate-900">
              Historial clínico
            </h3>
            <button
              onClick={() => setOpenModal(true)}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-semibold"
            >
              + Nuevo registro
            </button>
          </div>

          {loading ? (
            <p className="text-sm text-slate-500">Cargando historial...</p>
          ) : registros.length === 0 ? (
            <p className="text-sm text-slate-500">
              Aún no hay registros clínicos para esta mascota.
            </p>
          ) : (
            <div className="relative border-l-2 border-sky-200 ml-4 space-y-8">
              {registros.map((item) => (
                <div key={item.id} className="relative pl-8">
                  {/* Punto del timeline */}
                  <div className="absolute -left-[10px] top-1 h-4 w-4 rounded-full bg-sky-600 shadow shadow-sky-600/30" />

                  <div className="bg-slate-50 hover:bg-white transition rounded-2xl p-5 border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <div className="flex items-center gap-2 text-sky-700 font-semibold">
                        <Calendar className="h-4 w-4" />
                        {formatFecha(item.fecha)}
                      </div>

                      {item.medicamentos && (
                        <button
                          type="button"
                          onClick={() => abrirReceta(item)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                        >
                          <FileText className="h-3 w-3" />
                          Ver / imprimir receta
                        </button>
                      )}
                    </div>

                    {item.motivo_consulta && (
                      <>
                        <p className="font-semibold text-slate-900 mt-2">
                          Motivo de la consulta:
                        </p>
                        <p className="text-slate-700 text-sm">
                          {item.motivo_consulta}
                        </p>
                      </>
                    )}

                    {item.diagnostico && (
                      <>
                        <p className="font-semibold text-slate-900 mt-2">
                          Diagnóstico:
                        </p>
                        <p className="text-slate-700 text-sm">
                          {item.diagnostico}
                        </p>
                      </>
                    )}

                    {item.procedimientos && (
                      <>
                        <p className="font-semibold text-slate-900 mt-2">
                          Procedimientos:
                        </p>
                        <p className="text-slate-700 text-sm">
                          {item.procedimientos}
                        </p>
                      </>
                    )}

                    {item.tratamientos && (
                      <>
                        <p className="font-semibold text-slate-900 mt-2">
                          Tratamientos:
                        </p>
                        <p className="text-slate-700 text-sm">
                          {item.tratamientos}
                        </p>
                      </>
                    )}

                    {item.medicamentos && (
                      <>
                        <p className="font-semibold text-slate-900 mt-2">
                          Medicamentos:
                        </p>
                        <p className="text-slate-700 text-sm whitespace-pre-line">
                          {item.medicamentos}
                        </p>
                      </>
                    )}

                    {item.evolucion && (
                      <>
                        <p className="font-semibold text-slate-900 mt-2">
                          Evolución:
                        </p>
                        <p className="text-slate-700 text-sm">
                          {item.evolucion}
                        </p>
                      </>
                    )}

                    {item.notas && (
                      <>
                        <p className="font-semibold text-slate-900 mt-2">
                          Notas:
                        </p>
                        <p className="text-slate-700 text-sm">{item.notas}</p>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (tab === "vacunas") {
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">Vacunas</h3>
          {registrosVacunas.length === 0 ? (
            <p className="text-sm text-slate-500">
              No hay vacunas registradas aún para esta mascota.
            </p>
          ) : (
            <div className="space-y-4">
              {registrosVacunas.map((reg) => (
                <div
                  key={reg.id}
                  className="border border-purple-200 bg-purple-50 rounded-2xl p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-purple-700 uppercase tracking-[0.15em]">
                      Vacuna
                    </span>
                    <span className="text-xs text-slate-500">
                      {formatFecha(reg.fecha)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-800 font-medium">
                    {extraerLinea(reg.medicamentos, "vacuna")}
                  </p>
                  {reg.notas && (
                    <p className="text-xs text-slate-600 mt-2">
                      Notas: {reg.notas}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (tab === "antiparasitarios") {
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">
            Antiparasitarios
          </h3>
          {registrosAntiparasitarios.length === 0 ? (
            <p className="text-sm text-slate-500">
              No hay antiparasitarios registrados aún para esta mascota.
            </p>
          ) : (
            <div className="space-y-4">
              {registrosAntiparasitarios.map((reg) => (
                <div
                  key={reg.id}
                  className="border border-emerald-200 bg-emerald-50 rounded-2xl p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-emerald-700 uppercase tracking-[0.15em]">
                      Antiparasitario
                    </span>
                    <span className="text-xs text-slate-500">
                      {formatFecha(reg.fecha)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-800 font-medium">
                    {extraerLinea(reg.medicamentos, "antiparasitario")}
                  </p>
                  {reg.notas && (
                    <p className="text-xs text-slate-600 mt-2">
                      Notas: {reg.notas}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <LayoutVet>
      <div className="space-y-6">
        {/* Encabezado grande arriba */}
        <section className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <MessageSquareHeart className="h-7 w-7" />
            </div>
            <div>
              <p className="text-xs font-semibold tracking-[0.25em] text-sky-600 uppercase mb-1">
                Vetyon · Ficha clínica
              </p>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                Ficha clínica de {nombreMascota}
              </h1>
              <p className="text-sm text-slate-600">
                Gestiona el historial clínico, vacunas y antiparasitarios del
                paciente.
              </p>
            </div>
          </div>
        </section>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Columna izquierda: tarjeta paciente/cliente */}
          <aside className="lg:w-1/3 xl:w-1/4 bg-white rounded-3xl p-6 border border-slate-200 shadow-[0_8px_25px_rgba(15,23,42,0.06)] space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-sky-100 flex items-center justify-center text-sky-700 text-xl font-bold">
                {nombreMascota[0] ?? "M"}
              </div>
              <div>
                <h2 className="font-bold text-lg text-slate-900">
                  {nombreMascota}
                </h2>
                <p className="text-xs uppercase tracking-[0.15em] text-sky-600">
                  Paciente
                </p>
              </div>
            </div>

            <div className="space-y-2 text-sm text-slate-700">
              <p className="flex items-center gap-2">
                <UserRound className="h-4 w-4 text-slate-500" />
                <span className="font-semibold">Dueño:</span> {duenoNombre}
              </p>
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-slate-500" />
                <span className="font-semibold">Teléfono:</span>{" "}
                {duenoTelefonoMascota || "-"}
              </p>
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-slate-500" />
                <span className="font-semibold">Correo:</span>{" "}
                {duenoEmail || "-"}
              </p>
            </div>

            <div className="border-t border-slate-200 pt-4 text-sm text-slate-700 space-y-1">
              <p>
                <span className="font-semibold">Especie:</span>{" "}
                {especie || "No registrada"}
              </p>
              <p>
                <span className="font-semibold">Raza:</span>{" "}
                {raza || "No registrada"}
              </p>
              <p>
                <span className="font-semibold">Sexo:</span>{" "}
                {sexo || "No registrado"}
              </p>
              <p>
                <span className="font-semibold">¿Esterilizado?</span>{" "}
                {esterilizado}
              </p>
            </div>
          </aside>

          {/* Columna derecha: pestañas y contenido */}
          <section className="flex-1 bg-white rounded-3xl p-6 border border-slate-200 shadow-[0_8px_25px_rgba(15,23,42,0.06)]">
            {/* Tabs */}
            <div className="flex gap-4 border-b border-slate-200 mb-4 overflow-x-auto">
              <button
                onClick={() => setTab("datos")}
                className={`pb-2 text-sm font-medium border-b-2 -mb-px ${
                  tab === "datos"
                    ? "border-sky-600 text-sky-700"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                Datos del paciente
              </button>
              <button
                onClick={() => setTab("clinico")}
                className={`pb-2 text-sm font-medium border-b-2 -mb-px ${
                  tab === "clinico"
                    ? "border-sky-600 text-sky-700"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                Historial clínico
              </button>
              <button
                onClick={() => setTab("vacunas")}
                className={`pb-2 text-sm font-medium border-b-2 -mb-px ${
                  tab === "vacunas"
                    ? "border-sky-600 text-sky-700"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                Vacunas
              </button>
              <button
                onClick={() => setTab("antiparasitarios")}
                className={`pb-2 text-sm font-medium border-b-2 -mb-px ${
                  tab === "antiparasitarios"
                    ? "border-sky-600 text-sky-700"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                Antiparasitarios
              </button>
            </div>

            {/* Contenido según pestaña */}
            {renderTabContenido()}
          </section>
        </div>
      </div>

      {/* Modal de nuevo registro clínico */}
      <ModalAgregarRegistro
        open={openModal}
        onClose={() => setOpenModal(false)}
        mascotaId={id}
        citaId={null}
        motivoInicial=""
        nombreMascota={nombreMascota}
        onSuccess={cargarDatos}
      />

      {/* Modal de receta */}
      <ModalReceta
        open={openReceta}
        onClose={() => setOpenReceta(false)}
        mascota={mascota}
        registro={registroSeleccionado}
        veterinario={user}
        clinicaNombre={clinicaNombre}
        clinicaDireccion={clinicaDireccion}
        clinicaTelefono={clinicaTelefono}
      />
    </LayoutVet>
  );
}
