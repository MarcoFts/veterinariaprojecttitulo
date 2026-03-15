import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { setTokens, logout } from "../../auth";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login: setAuthUser } = useAuth();

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1) Login
      const res = await api.post("/auth/login/", {
        email: form.email,
        password: form.password,
      });

      const data = res.data;
      if (!data?.access) {
        setError("No se recibió token. Revisa credenciales.");
        setLoading(false);
        return;
      }

      // 2) Guardar tokens
      setTokens({ access: data.access, refresh: data.refresh });

      // 3) Obtener perfil
      const meRes = await api.get("/auth/me/");
      const me = meRes.data;

      const esAdmin = me?.is_admin === true || me?.is_staff === true || me?.is_superuser === true;

      if (!esAdmin) {
        logout();
        setError("Esta cuenta no tiene permisos de administrador.");
        setLoading(false);
        return;
      }

      // 4) Guardar usuario en contexto
      const userParaContexto = {
        id: me.id,
        email: me.email || form.email,
        nombre:
          me.name ||
          `${me.first_name || ""} ${me.last_name || ""}`.trim(),
        rol: "administrador",
        is_admin: true,
        is_staff: me.is_staff,
      };

      setAuthUser(userParaContexto, data.access);

      // 5) Navegar al panel admin
      navigate("/admin/home", { replace: true });
    } catch (err) {

      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.error ||
        "Credenciales incorrectas.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
        {/* ENCABEZADO */}
        <div className="mb-6 text-center">
          <p className="text-xs font-semibold tracking-[0.25em] uppercase text-slate-700 mb-2">
            Vetyon · ADMINISTRADOR
          </p>
          <h1 className="text-2xl font-bold text-slate-900">
            Iniciar sesión como Administrador
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Accede al panel de gestión e inventario del sistema.
          </p>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* EMAIL */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-slate-700"
            >
              Correo administrador
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm bg-slate-50 
              focus:outline-none focus:ring-2 focus:ring-slate-700"
              placeholder="admin@clinica.cl"
              required
            />
          </div>

          {/* PASSWORD */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-slate-700"
            >
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm bg-slate-50 
              focus:outline-none focus:ring-2 focus:ring-slate-700"
              placeholder="••••••••"
              required
            />
          </div>

          {/* BOTÓN */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 rounded-xl bg-gradient-to-r from-slate-800 to-slate-700 text-white 
            text-sm font-semibold py-2.5 shadow-md hover:shadow-lg hover:opacity-95 transition disabled:opacity-60"
          >
            {loading ? "Ingresando..." : "Iniciar sesión"}
          </button>
        </form>
      </div>
    </div>
  );
}
