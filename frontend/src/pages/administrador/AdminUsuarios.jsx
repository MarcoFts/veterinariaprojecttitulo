import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Search, Shield } from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/es";
dayjs.locale("es");

import { getAdminUsers, updateUserRole } from "../../services/api";

export default function AdminUsuarios() {
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const cargar = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getAdminUsers(q ? { q } : {});
      setUsers(res?.data || []);
    } catch (e) {
      console.error(e);
      setError("No se pudieron cargar los usuarios.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rows = useMemo(() => users || [], [users]);

  const roleLabel = (u) => {
    if (u.is_staff || u.is_superuser) return "admin";
    const roles = (u.roles || []).map((r) => r.toLowerCase());
    if (roles.includes("veterinarios")) return "veterinario";
    return "cliente";
  };

  const onChangeRole = async (u, newRole) => {
    const actual = roleLabel(u);
    if (newRole === actual) return;

    const ok = confirm(
      `¿Cambiar rol de "${u.full_name}" de ${actual} a ${newRole}?`
    );
    if (!ok) return;

    try {
      const res = await updateUserRole(u.id, newRole);
      const updated = res?.data;

      setUsers((prev) =>
        prev.map((x) => (x.id === u.id ? updated : x))
      );
    } catch (e) {
      console.error(e);
      alert("No se pudo cambiar el rol. Revisa permisos/validaciones.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Administración de usuarios</h1>
          <p className="text-sm text-slate-600">
            Cambia roles entre Cliente, Veterinario y Admin (staff).
          </p>
        </div>

        <button
          onClick={cargar}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
        >
          <RefreshCw className="h-4 w-4" />
          Recargar
        </button>
      </div>

      {/* Buscador */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-slate-700">Buscar</label>
            <div className="mt-1 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
              <Search className="h-4 w-4 text-slate-500" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Nombre, apellido, email..."
                className="w-full text-sm outline-none"
              />
            </div>
          </div>

          <div className="flex items-end">
            <button
              onClick={cargar}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              <Shield className="h-4 w-4" />
              Buscar
            </button>
          </div>
        </div>
      </div>

      {/* Estados */}
      {loading && <p className="text-sm text-slate-500">Cargando usuarios...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && rows.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">
          No hay resultados.
        </div>
      )}

      {/* Tabla */}
      {!loading && !error && rows.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Usuario</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Email</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Rol</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Creado</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((u) => {
                const rol = roleLabel(u);

                return (
                  <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {u.full_name || u.username || `#${u.id}`}
                      <div className="text-xs text-slate-500">ID: {u.id}</div>
                    </td>

                    <td className="px-4 py-3 text-slate-700">{u.email || u.username}</td>

                    <td className="px-4 py-3">
                      <select
                        value={rol}
                        onChange={(e) => onChangeRole(u, e.target.value)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                      >
                        <option value="cliente">Cliente</option>
                        <option value="veterinario">Veterinario</option>
                        <option value="admin">Admin</option>
                      </select>

                      <div className="mt-1 text-xs text-slate-500">
                        {u.is_staff || u.is_superuser ? "staff" : "no staff"}
                        {u.has_veterinario ? " · perfil vet" : ""}
                        {u.has_cliente ? " · perfil cliente" : ""}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-slate-700">
                      {u.date_joined ? dayjs(u.date_joined).format("DD/MM/YYYY") : "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
