// src/pages/cliente/MisMascotas.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import LayoutCliente from "../../components/layout/LayoutCliente";
import {
  PawPrint,
  CalendarDays,
  Weight,
  ShieldCheck,
  ScanLine,
  Info,
  FileText,
  Pencil,
  Trash2,
} from "lucide-react";
import { getMascotas, getCitas } from "../../services/api";
import ModalEditarMascota from "../../components/modals/ModalEditarMascota";
import ModalEliminarMascota from "../../components/modals/ModalEliminarMascota";
import dayjs from "dayjs";
import "dayjs/locale/es";

dayjs.locale("es");

// ---------------------------------------------------------
// HELPERS
// ---------------------------------------------------------
const formatFecha = (fecha) => {
  if (!fecha) return "Sin registrar";
  return dayjs(fecha).format("DD MMM YYYY");
};

export default function MisMascotas() {
  const [mascotas, setMascotas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mascotaEditar, setMascotaEditar] = useState(null);
  const [mascotaEliminar, setMascotaEliminar] = useState(null);
  const [errorEliminar, setErrorEliminar] = useState("");

  // ---------------------------------------------------------
  // FETCH
  // ---------------------------------------------------------
  const fetchMascotas = async () => {
    try {
      setError("");
      setLoading(true);

      const res = await getMascotas();
      const data = res.data;

      setMascotas(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error cargando mascotas", err);
      setError("No se pudieron cargar tus mascotas.");
    } finally {
      setLoading(false);
    }
  };

  // Función para verificar si la mascota tiene citas confirmadas
  const checkCitasConfirmadas = async (mascotaId) => {
    try {
      const citasResp = await getCitas({ mascota_id: mascotaId });
      const citas = citasResp.data || [];

      // Verificar si alguna cita está confirmada
      return citas.some(cita => cita.estado === "confirmada");
    } catch (err) {
      console.error("Error verificando citas", err);
      setErrorEliminar("No se pudieron verificar las citas de la mascota.");
      return false;
    }
  };

  useEffect(() => {
    fetchMascotas();
  }, []);

  // Función para eliminar la mascota
  const handleEliminarMascota = async () => {
    if (!mascotaEliminar) return;

    // Verificar si tiene citas confirmadas
    const tieneCitasConfirmadas = await checkCitasConfirmadas(mascotaEliminar.id);
    if (tieneCitasConfirmadas) {
      setErrorEliminar("No se puede eliminar una mascota con citas confirmadas.");
      return;
    }

    setErrorEliminar("");
    // Aquí se hace la eliminación de la mascota
    // Si ya tienes el API listo para eliminar, lo llamarías aquí.
    // Ejemplo: await eliminarMascota(mascotaEliminar.id);
    
    // Luego, actualizamos las mascotas
    fetchMascotas();
    setMascotaEliminar(null);
  };

  return (
    <LayoutCliente>
      <div className="space-y-8">
        {/* ENCABEZADO */}
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.25em] text-sky-600 uppercase mb-1">
              Vetyon · Cliente
            </p>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                <PawPrint size={20} />
              </span>
              <span>Mis mascotas</span>
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Revisa la información de cada una de tus mascotas y mantén sus
              datos siempre actualizados.
            </p>
          </div>

          <div className="hidden md:flex items-center gap-3 text-xs text-slate-500 bg-white/70 rounded-xl px-4 py-2 shadow-sm border border-slate-100">
            <Info size={16} className="text-sky-500" />
            <span>
              Para agregar una nueva mascota, ve a{" "}
              <span className="font-semibold text-sky-600">
                Registrar mascota
              </span>
              .
            </span>
          </div>
        </header>

        {/* CONTENEDOR PRINCIPAL */}
        <section className="bg-white/60 rounded-2xl shadow-xl border border-white/60 p-5 md:p-6 space-y-5">
          {/* CARGA */}
          {loading && (
            <p className="text-sm text-slate-500">Cargando tus mascotas…</p>
          )}

          {/* ERROR */}
          {error && !loading && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
              <Info size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* ERROR EN ELIMINAR */}
          {errorEliminar && !loading && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
              <Info size={16} />
              <span>{errorEliminar}</span>
            </div>
          )}

          {/* SIN MASCOTAS */}
          {!loading && !error && mascotas.length === 0 && (
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-4">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-sky-100 text-sky-600">
                  <PawPrint size={18} />
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-slate-800">
                    Aún no tienes mascotas registradas
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Registra a tus mascotas para poder agendar citas y llevar su
                    historial de salud dentro de Vetyon.
                  </p>
                </div>
              </div>

              <Link
                to="/cliente/mascotas"
                className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-sky-500 to-blue-600 shadow-sm hover:shadow-lg hover:opacity-90 transition"
              >
                Registrar mascota
              </Link>
            </div>
          )}

          {/* LISTADO */}
          {!loading && !error && mascotas.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {mascotas.map((m) => (
                <article
                  key={m.id}
                  className="group bg-white/90 rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-[2px] transition transform p-4 md:p-5"
                >
                  {/* HEADER */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center font-semibold">
                        {m.nombre?.charAt(0) || "🐾"}
                      </div>
                      <div>
                        <h2 className="text-sm font-semibold text-slate-900">
                          {m.nombre || "Sin nombre"}
                        </h2>
                        <p className="text-[11px] text-slate-500">
                          {m.raza || "Raza no especificada"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setMascotaEditar(m)}
                        className="p-1 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition"
                        title="Editar"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setMascotaEliminar(m)}
                        className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                        title="Eliminar"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {m.especie && (
                    <span className="inline-flex mb-2 px-2 py-0.5 rounded-full bg-sky-50 text-sky-600 text-[11px] font-medium">
                      {m.especie}
                    </span>
                  )}

                  {/* DATOS */}
                  <dl className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                      <dt className="flex items-center gap-1.5">
                        <CalendarDays size={13} className="text-sky-500" />
                        Fecha nacimiento
                      </dt>
                      <dd className="font-medium text-slate-800">
                        {formatFecha(m.fecha_nacimiento)}
                      </dd>
                    </div>

                    <div className="flex items-center justify-between">
                      <dt className="flex items-center gap-1.5">
                        <Weight size={13} className="text-sky-500" />
                        Peso
                      </dt>
                      <dd className="font-medium text-slate-800">
                        {m.peso_kg ? `${m.peso_kg} kg` : "Sin registrar"}
                      </dd>
                    </div>

                    <div className="flex items-center justify-between">
                      <dt className="flex items-center gap-1.5">
                        <ShieldCheck size={13} className="text-sky-500" />
                        Esterilizado
                      </dt>
                      <dd className="font-medium text-slate-800">
                        {m.esterilizado ? "Sí" : "No / sin registrar"}
                      </dd>
                    </div>

                    <div className="flex items-center justify-between">
                      <dt className="flex items-center gap-1.5">
                        <ScanLine size={13} className="text-sky-500" />
                        Microchip
                      </dt>
                      <dd className="font-medium text-slate-800">
                        {m.microchip || "Sin registrar"}
                      </dd>
                    </div>
                  </dl>

                  {/* NOTAS */}
                  {m.notas_salud && (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <p className="text-[11px] font-semibold text-slate-500 mb-1 flex items-center gap-1.5">
                        <FileText size={12} className="text-sky-500" />
                        Notas de salud
                      </p>
                      <p className="text-[11px] text-slate-600 line-clamp-3">
                        {m.notas_salud}
                      </p>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* MODALS */}
      {mascotaEditar && (
        <ModalEditarMascota
          mascota={mascotaEditar}
          onClose={() => setMascotaEditar(null)}
          onUpdated={fetchMascotas}
        />
      )}

      {mascotaEliminar && (
        <ModalEliminarMascota
          mascota={mascotaEliminar}
          onClose={() => setMascotaEliminar(null)}
          onDeleted={fetchMascotas}
          onError={setErrorEliminar}
        />
      )}
    </LayoutCliente>
  );
}
