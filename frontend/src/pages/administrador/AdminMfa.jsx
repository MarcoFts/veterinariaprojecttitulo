import { useEffect, useState } from "react";
import { RotateCcw, Search, ShieldCheck } from "lucide-react";
import { adminMfaApi } from "../../services/api";

export default function AdminMfa() {
  const [settings, setSettings] = useState(null);
  const [users, setUsers] = useState([]);
  const [resetLog, setResetLog] = useState([]);
  const [logPage, setLogPage] = useState(1);
  const [logTotalPages, setLogTotalPages] = useState(1);
  const [logFrom, setLogFrom] = useState("");
  const [logTo, setLogTo] = useState("");
  const [logUser, setLogUser] = useState("");
  const [query, setQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [reason, setReason] = useState("");
  const [modalError, setModalError] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadResetLog = async (pageNum = 1) => {
    if (logFrom && logTo && logFrom > logTo) {
      setError("La fecha de inicio no puede ser posterior a la fecha de término.");
      return;
    }
    setError("");
    try {
      const params = { page: pageNum, page_size: 10 };
      if (logFrom) params.from = logFrom;
      if (logTo) params.to = logTo;
      if (logUser.trim()) params.user = logUser.trim();
      const lRes = await adminMfaApi.listResetLog(params);
      setResetLog(lRes.data.results || []);
      setLogPage(lRes.data.page || 1);
      setLogTotalPages(lRes.data.total_pages || 1);
    } catch (err) {
      setError(err?.response?.data?.detail || "No se pudo filtrar el registro de reinicios.");
    }
  };

  const loadData = async (searchQ = query) => {
    setError("");
    try {
      const [sRes, uRes, lRes] = await Promise.all([
        adminMfaApi.getSettings(),
        adminMfaApi.listUsers(searchQ),
        adminMfaApi.listResetLog({ page: 1, page_size: 10 }),
      ]);
      setSettings(sRes.data);
      setUsers(uRes.data);
      setResetLog(lRes.data.results || []);
      setLogPage(lRes.data.page || 1);
      setLogTotalPages(lRes.data.total_pages || 1);
    } catch {
      setError("No se pudo cargar la consola de doble factor.");
    }
  };

  useEffect(() => {
    loadData("");
  }, []);

  useEffect(() => {
    if (!selectedUser) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") setSelectedUser(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedUser]);

  const handleToggleGlobal = async () => {
    if (!settings) return;
    setError("");
    setMessage("");
    try {
      const { data } = await adminMfaApi.updateSettings({
        habilitado: !settings.habilitado,
      });
      setSettings(data);
      setMessage(
        data.habilitado
          ? "Doble factor habilitado globalmente."
          : "Doble factor deshabilitado globalmente (usuarios en estado S0)."
      );
    } catch {
      setError("Error al actualizar el parámetro global.");
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadData(query);
  };

  const handleConfirmReset = async (e) => {
    e.preventDefault();
    if (!selectedUser || submitting) return;
    setError("");
    setModalError("");
    setMessage("");
    setSubmitting(true);
    try {
      const { data } = await adminMfaApi.resetUser(selectedUser.id, reason);
      setMessage(
        `2FA reiniciado para ${selectedUser.username}. Estado de correo: ${data.emailStatus}.`
      );
      setSelectedUser(null);
      setReason("");
      await loadData(query);
    } catch (err) {
      setModalError(err?.response?.data?.detail || "No se pudo reiniciar el 2FA.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-slate-900" />
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Consola de Doble Factor (MEJ-02)
            </h1>
            <p className="text-sm text-slate-500">
              Política global, reinicio de dispositivos y registro de auditoría.
            </p>
          </div>
        </div>

        {settings && (
          <button
            type="button"
            onClick={handleToggleGlobal}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              settings.habilitado
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : "bg-slate-200 text-slate-700 hover:bg-slate-300"
            }`}
          >
            2FA Global: {settings.habilitado ? "Activo" : "Apagado (S0)"}
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}
      {message && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-800">
          {message}
        </div>
      )}

      {/* BÚSQUEDA Y REINICIO */}
      <section className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-800">Usuarios y Estado 2FA</h2>
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por usuario, correo o nombre"
                className="pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 text-sm w-64"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-sm font-medium"
            >
              Buscar
            </button>
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase border-b border-slate-200">
              <tr>
                <th className="py-2 pr-4">Usuario</th>
                <th className="py-2 pr-4">Nombre</th>
                <th className="py-2 pr-4">Correo</th>
                <th className="py-2 pr-4">Estado 2FA</th>
                <th className="py-2">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="py-2.5 pr-4 font-medium text-slate-900">{u.username}</td>
                  <td className="py-2.5 pr-4 text-slate-700">{u.name}</td>
                  <td className="py-2.5 pr-4 text-slate-500">{u.email || "Sin correo"}</td>
                  <td className="py-2.5 pr-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        u.mfa_activo
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {u.mfa_activo ? "Activo (S4)" : "Pendiente"}
                    </span>
                  </td>
                  <td className="py-2.5">
                    <button
                      type="button"
                      disabled={!u.mfa_activo}
                      onClick={() => {
                        setSelectedUser(u);
                        setReason("");
                        setModalError("");
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-50 text-amber-800 hover:bg-amber-100 disabled:opacity-40"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Reiniciar 2FA
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* REGISTRO DE REINICIOS */}
      <section className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-800">
            Registro de Reinicios (Solo Lectura)
          </h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              loadResetLog(1);
            }}
            className="flex flex-wrap items-center gap-2 text-xs"
          >
            <input
              type="date"
              value={logFrom}
              onChange={(e) => setLogFrom(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-300"
              aria-label="Fecha desde"
            />
            <input
              type="date"
              value={logTo}
              onChange={(e) => setLogTo(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-300"
              aria-label="Fecha hasta"
            />
            <input
              type="text"
              value={logUser}
              onChange={(e) => setLogUser(e.target.value)}
              placeholder="Usuario o admin"
              className="px-2.5 py-1.5 rounded-xl border border-slate-300 w-36"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-xl bg-slate-900 text-white font-medium"
            >
              Filtrar
            </button>
          </form>
        </div>
        {resetLog.length === 0 ? (
          <p className="text-sm text-slate-500">Aún no se registran reinicios.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-slate-500 uppercase border-b border-slate-200">
                  <tr>
                    <th className="py-2 pr-3">Fecha</th>
                    <th className="py-2 pr-3">Usuario</th>
                    <th className="py-2 pr-3">Administrador</th>
                    <th className="py-2 pr-3">Motivo</th>
                    <th className="py-2 pr-3">Correo</th>
                    <th className="py-2">IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {resetLog.map((r) => (
                    <tr key={r.id}>
                      <td className="py-2 pr-3">{new Date(r.reset_at).toLocaleString()}</td>
                      <td className="py-2 pr-3 font-medium">{r.target_username}</td>
                      <td className="py-2 pr-3">{r.admin_username}</td>
                      <td className="py-2 pr-3">{r.reason}</td>
                      <td className="py-2 pr-3">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                          {r.email_status}
                        </span>
                      </td>
                      <td className="py-2 text-slate-500">{r.origin_ip || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between pt-2 text-xs text-slate-600">
              <span>
                Página {logPage} de {logTotalPages}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={logPage <= 1}
                  onClick={() => loadResetLog(logPage - 1)}
                  className="px-3 py-1 rounded-lg border border-slate-300 disabled:opacity-40"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  disabled={logPage >= logTotalPages}
                  onClick={() => loadResetLog(logPage + 1)}
                  className="px-3 py-1 rounded-lg border border-slate-300 disabled:opacity-40"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      {/* MODAL CONFIRMACIÓN DE REINICIO */}
      {selectedUser && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
        >
          <form
            onSubmit={handleConfirmReset}
            className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl"
          >
            <h3 className="font-bold text-slate-900">
              Confirmar reinicio de 2FA — {selectedUser.username}
            </h3>
            {modalError && (
              <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                {modalError}
              </div>
            )}
            <p className="text-xs text-slate-600">
              Se eliminará el dispositivo actual, se invalidarán sus exenciones de 12 horas y el
              usuario deberá enrolar nuevamente sin opción de posponer.
            </p>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Motivo obligatorio ({reason.trim().length}/10 caracteres mínimos)
              </label>
              <textarea
                rows={3}
                maxLength={500}
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ej: Usuario reporta extravío de teléfono móvil verificado por soporte"
                className="w-full rounded-xl border border-slate-300 p-2.5 text-sm"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-sm text-slate-700"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting || reason.trim().length < 10}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium disabled:opacity-50"
              >
                {submitting ? "Reiniciando..." : "Confirmar reinicio"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
