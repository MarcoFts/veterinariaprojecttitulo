// src/pages/administrador/AdminMotivos.jsx
import { useEffect, useMemo, useState } from "react";
import {
  ClipboardList,
  Plus,
  Search,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  Trash2,
} from "lucide-react";
import {
  getMotivosConsulta,
  crearMotivoConsulta,
  editarMotivoConsulta,
  eliminarMotivoConsulta,
} from "../../services/api";

export default function AdminMotivos() {
  const [motivos, setMotivos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const [form, setForm] = useState({ nombre: "", codigo: "", activo: true });
  const [q, setQ] = useState("");

  const cargar = async () => {
    setLoading(true);
    setError("");
    setOk("");
    try {
      const res = await getMotivosConsulta();
      setMotivos(res?.data || []);
    } catch (e) {
      console.error(e);
      setError("No se pudieron cargar los motivos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const motivosFiltrados = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return motivos;
    return motivos.filter((m) => {
      const nombre = (m?.nombre || "").toLowerCase();
      const codigo = (m?.codigo || "").toLowerCase();
      return nombre.includes(term) || codigo.includes(term);
    });
  }, [motivos, q]);

  const onCrear = async (e) => {
    e.preventDefault();
    setError("");
    setOk("");

    if (!form.nombre.trim()) {
      setError("El nombre del motivo es obligatorio.");
      return;
    }

    setSaving(true);
    try {
      await crearMotivoConsulta({
        nombre: form.nombre.trim(),
        codigo: form.codigo.trim() || null,
        activo: Boolean(form.activo),
      });

      setOk("Motivo creado ✅");
      setForm({ nombre: "", codigo: "", activo: true });
      await cargar();
    } catch (e) {
      console.error(e);
      const msg =
        e?.response?.data?.detail ||
        (typeof e?.response?.data === "object"
          ? JSON.stringify(e.response.data)
          : e?.message) ||
        "No se pudo crear el motivo.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const toggleActivo = async (motivo) => {
    setError("");
    setOk("");
    try {
      await editarMotivoConsulta(motivo.id, { activo: !motivo.activo });
      setOk("Motivo actualizado ✅");
      await cargar();
    } catch (e) {
      console.error(e);
      setError(
        "No se pudo actualizar. Si tu backend solo permite GET/POST, falta habilitar PATCH/PUT."
      );
    }
  };

  const onEliminar = async (motivo) => {
    setError("");
    setOk("");
    if (!window.confirm(`¿Eliminar "${motivo.nombre}"?`)) return;

    try {
      await eliminarMotivoConsulta(motivo.id);
      setOk("Motivo eliminado ✅");
      await cargar();
    } catch (e) {
      console.error(e);
      setError(
        "No se pudo eliminar. Si tu backend solo permite GET/POST, falta habilitar DELETE."
      );
    }
  };

  return (
    <div className="p-5 md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <ClipboardList className="h-6 w-6" />
            Motivos de consulta
          </h1>
          <p className="text-sm text-slate-600">
            Crea y administra los motivos visibles al agendar/atender citas.
          </p>
        </div>

        <button
          onClick={cargar}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      {ok && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
          {ok}
        </div>
      )}

      {/* Crear */}
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-md p-5 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Agregar motivo</h2>

        <form onSubmit={onCrear} className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="md:col-span-2">
            <label className="text-xs text-slate-600">Nombre *</label>
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              value={form.nombre}
              onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
              placeholder="Ej: Control general"
            />
          </div>

          <div>
            <label className="text-xs text-slate-600">Código (opcional)</label>
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              value={form.codigo}
              onChange={(e) => setForm((f) => ({ ...f, codigo: e.target.value }))}
              placeholder="Ej: control_general"
            />
          </div>

          <div className="flex items-center gap-2 pt-6">
            <input
              id="motivo-activo"
              type="checkbox"
              checked={form.activo}
              onChange={(e) => setForm((f) => ({ ...f, activo: e.target.checked }))}
            />
            <label htmlFor="motivo-activo" className="text-sm text-slate-700">
              Activo
            </label>
          </div>

          <div className="md:col-span-2">
            <button
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
            >
              <Plus className="h-4 w-4" />
              {saving ? "Guardando..." : "Crear motivo"}
            </button>
          </div>
        </form>
      </div>

      {/* Buscar + Lista */}
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-md p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="text-lg font-bold text-slate-900">Listado</h2>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-sm"
              placeholder="Buscar por nombre o código..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-slate-600 border-b">
                <th className="py-2 pr-3">Nombre</th>
                <th className="py-2 pr-3">Código</th>
                <th className="py-2 pr-3">Estado</th>
                <th className="py-2 pr-3 text-right">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td className="py-4 text-slate-500" colSpan={4}>
                    Cargando...
                  </td>
                </tr>
              ) : motivosFiltrados.length === 0 ? (
                <tr>
                  <td className="py-4 text-slate-500" colSpan={4}>
                    No hay motivos para mostrar.
                  </td>
                </tr>
              ) : (
                motivosFiltrados.map((m) => (
                  <tr key={m.id} className="border-b last:border-b-0">
                    <td className="py-2 pr-3 font-medium text-slate-900">{m.nombre}</td>
                    <td className="py-2 pr-3 text-slate-600">{m.codigo || "—"}</td>
                    <td className="py-2 pr-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                          m.activo
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-slate-100 text-slate-700 border border-slate-200"
                        }`}
                      >
                        {m.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="py-2 pr-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => toggleActivo(m)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          {m.activo ? (
                            <ToggleRight className="h-4 w-4" />
                          ) : (
                            <ToggleLeft className="h-4 w-4" />
                          )}
                          {m.activo ? "Desactivar" : "Activar"}
                        </button>

                        <button
                          onClick={() => onEliminar(m)}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
