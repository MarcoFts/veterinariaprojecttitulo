import { useEffect, useState } from "react";
import LayoutVet from "../../components/layout/LayoutVet";
import {
  getMotivosConsulta,
  crearMotivoConsulta,
} from "../../services/api";

import { Plus, Pencil, Trash2, RefreshCcw, CheckCircle2 } from "lucide-react";
import ModalEditarMotivoConsulta from "../../components/modals/ModalEditarMotivoConsulta";
import ModalEliminarMotivoConsulta from "../../components/modals/ModalEliminarMotivoConsulta";

export default function ConfigMotivosConsulta() {
  // datos
  const [motivos, setMotivos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // creación
  const [nombre, setNombre] = useState("");
  const [codigo, setCodigo] = useState("");

  // modales
  const [modalEditarOpen, setModalEditarOpen] = useState(false);
  const [modalEliminarOpen, setModalEliminarOpen] = useState(false);
  const [motivoSeleccionado, setMotivoSeleccionado] = useState(null);

  // toast
  const [toastMsg, setToastMsg] = useState("");

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 2200);
  };

  const cargar = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getMotivosConsulta();
      const data = Array.isArray(res.data) ? res.data : res.data.results;
      setMotivos(data || []);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar los motivos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const handleCrear = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    const payload = {
      nombre: nombre.trim(),
      codigo: codigo.trim() || nombre.toLowerCase().replace(/\s+/g, "_"),
    };

    setLoading(true);
    try {
      const res = await crearMotivoConsulta(payload);
      setMotivos((prev) => [res.data, ...prev]);

      setNombre("");
      setCodigo("");

      showToast("Motivo agregado ✓");
    } catch (err) {
      console.error(err);
      alert("No se pudo crear el motivo.");
    } finally {
      setLoading(false);
    }
  };

  const abrirEditar = (motivo) => {
    setMotivoSeleccionado(motivo);
    setModalEditarOpen(true);
  };

  const abrirEliminar = (motivo) => {
    setMotivoSeleccionado(motivo);
    setModalEliminarOpen(true);
  };

  const onMotivoEditado = (actualizado) => {
    setMotivos((prev) =>
      prev.map((m) => (m.id === actualizado.id ? actualizado : m))
    );
    showToast("Motivo actualizado ✓");
  };

  const onMotivoEliminado = (id) => {
    setMotivos((prev) => prev.filter((m) => m.id !== id));
    showToast("Motivo eliminado ✓");
  };

  return (
    <LayoutVet>
      {/* TOAST */}
      {toastMsg && (
        <div className="fixed top-4 right-4 z-50 animate-fadeScale">
          <div className="flex items-center gap-2 bg-white shadow-lg border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-800">
            <CheckCircle2 className="text-green-600" size={18} />
            {toastMsg}
          </div>
        </div>
      )}

      <div className="space-y-6">

        {/* HEADER */}
        <header className="flex flex-col gap-1">
          <p className="text-xs font-semibold tracking-[0.25em] text-sky-600 uppercase">
            Vetyon · Configuración
          </p>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900">
            Motivos de consulta
          </h1>
          <p className="text-sm text-slate-600">
            Crea y gestiona los motivos usados al registrar o agendar citas.
          </p>
        </header>

        {/* FORMULARIO CREACIÓN */}
        <section className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4 space-y-3">
          <h2 className="text-sm font-semibold text-slate-900">
            Crear un nuevo motivo
          </h2>

          <form
            onSubmit={handleCrear}
            className="grid grid-cols-1 md:grid-cols-3 gap-3"
          >
            <div className="flex flex-col">
              <label className="text-xs font-medium text-slate-600">
                Nombre del motivo
              </label>
              <input
                className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm bg-slate-50 focus:ring-2 focus:ring-sky-300 outline-none transition"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Control general"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-xs font-medium text-slate-600">
                Código (opcional)
              </label>
              <input
                className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm bg-slate-50 focus:ring-2 focus:ring-sky-300 outline-none transition"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                placeholder="control_general"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 shadow-sm active:scale-[0.98] transition"
              >
                <Plus className="h-4 w-4" />
                Agregar
              </button>
            </div>
          </form>
        </section>

        {/* ERROR */}
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            {error}
          </div>
        )}

        {/* TABLA */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <p className="text-xs font-semibold text-slate-700">Lista de motivos</p>

            <button
              onClick={cargar}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 active:scale-[0.97] transition"
            >
              <RefreshCcw className="h-3.5 w-3.5" />
              Actualizar
            </button>
          </div>

          {motivos.length === 0 ? (
            <div className="px-4 py-6 text-center text-xs text-slate-500">
              No hay motivos registrados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70">
                    <th className="px-4 py-2 text-left font-medium text-slate-500">
                      Nombre
                    </th>
                    <th className="px-4 py-2 text-left font-medium text-slate-500">
                      Código
                    </th>
                    <th className="px-4 py-2 text-right font-medium text-slate-500">
                      Acciones
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {motivos.map((m) => (
                    <tr
                      key={m.id}
                      className="border-b border-slate-50 hover:bg-slate-50/50 transition"
                    >
                      <td className="px-4 py-2 text-slate-900 font-medium">
                        {m.nombre}
                      </td>
                      <td className="px-4 py-2 text-slate-600">
                        {m.codigo}
                      </td>

                      <td className="px-4 py-2">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => abrirEditar(m)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 active:scale-[0.97] transition"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Editar
                          </button>

                          <button
                            onClick={() => abrirEliminar(m)}
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-2 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 active:scale-[0.97] transition"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* MODALES */}
      <ModalEditarMotivoConsulta
        open={modalEditarOpen}
        onClose={() => setModalEditarOpen(false)}
        motivo={motivoSeleccionado}
        onUpdated={onMotivoEditado}
      />

      <ModalEliminarMotivoConsulta
        open={modalEliminarOpen}
        onClose={() => setModalEliminarOpen(false)}
        motivo={motivoSeleccionado}
        onDeleted={onMotivoEliminado}
      />
    </LayoutVet>
  );
}
