import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { setTokens, logout } from "../../auth"; // ajusta ruta si auth.js está en otro lado
import api from "../../services/api"; // si tu api.js exporta axios instance default
// Si NO tienes ese api, más abajo te dejo versión con fetch

export default function VeterinarioLogin() {
  const navigate = useNavigate();
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
      // 1) Login real
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

      // 3) Traer usuario para validar rol
      const meRes = await api.get("/auth/me/");
      const me = meRes.data;

      // Ajusta esta validación según tu backend:
      const esVeterinario =
        me?.is_veterinario === true ||
        me?.rol === "veterinario" ||
        me?.tipo === "veterinario" ||
        me?.is_staff === true;

      if (!esVeterinario) {
        logout();
        setError("Esta cuenta no tiene permiso de veterinario.");
        setLoading(false);
        return;
      }

      // 4) Redirigir
      navigate("/veterinario/home", { replace: true });
    } catch (err) {
      // Errores típicos DRF
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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
        {/* ENCABEZADO */}
        <div className="mb-6 text-center">
          <p className="text-xs font-semibold tracking-[0.25em] uppercase text-blue-600 mb-2">
            VETCARE · VETERINARIO
          </p>
          <h1 className="text-2xl font-bold text-slate-900">
            Iniciar sesión como Veterinario
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Accede a tu panel clínico, agenda y pacientes.
          </p>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* FORMULARIO */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* EMAIL */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
              Correo institucional
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm bg-slate-50 
              focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="veterinario@clinica.cl"
              required
            />
          </div>

          {/* PASSWORD */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm bg-slate-50 
              focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="••••••••"
              required
            />
          </div>

          {/* BOTÓN */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 text-white 
            text-sm font-semibold py-2.5 shadow-md hover:shadow-lg hover:opacity-95 transition disabled:opacity-60"
          >
            {loading ? "Ingresando..." : "Iniciar sesión"}
          </button>
        </form>

        {/* CAMBIO A CLIENTE */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500">
            ¿Eres cliente?{" "}
            <Link
              to="/login/cliente"
              className="font-semibold text-blue-600 hover:text-sky-700"
            >
              Ir al acceso de cliente
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
