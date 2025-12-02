// src/pages/auth/ClienteLogin.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api, { login as apiLogin } from "../../services/api";
import { setTokens } from "../../auth";
import { useAuth } from "../../context/AuthContext";

export default function ClienteLogin() {
  const navigate = useNavigate();
  const { login: setAuthUser } = useAuth();

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const resp = await apiLogin(form.email, form.password);
      const { access, refresh } = resp.data;

      if (!access) {
        setError("No se recibió token de acceso. Revisa credenciales.");
        setLoading(false);
        return;
      }

      setTokens({ access, refresh });

      const meRes = await api.get("/auth/me/");
      const me = meRes.data;

      // 🔥 GUARDA cliente_id EN LOCALSTORAGE (OBLIGATORIO)
      localStorage.setItem("cliente_id", me.cliente_id);


      if (!me?.cliente_id) {
        setError("Esta cuenta no está registrada como cliente.");
        setLoading(false);
        return;
      }

      const userParaContexto = {
        id: me.id,
        email: me.email,
        nombre: me.name,
        rol: "cliente",
        cliente_id: me.cliente_id,
        is_vet: me.is_vet,
        is_staff: me.is_staff,
      };

      setAuthUser(userParaContexto);

      navigate("/cliente/home", { replace: true });
    } catch (err) {
      console.error("Error en login cliente:", err?.response?.data || err);
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.error ||
        "Credenciales incorrectas o usuario no existe.";
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
          <p className="text-xs font-semibold tracking-[0.25em] uppercase text-sky-600 mb-2">
            VETYON · CLIENTE
          </p>
          <h1 className="text-2xl font-bold text-slate-900">
            Iniciar sesión como Cliente
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Ingresa con tus datos para gestionar tus mascotas y citas.
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
              Correo electrónico
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm bg-slate-50 
              focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="cliente@ejemplo.cl"
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
              focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="••••••••"
              required
            />
          </div>

          {/* BOTÓN */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white 
            text-sm font-semibold py-2.5 shadow-md hover:shadow-lg hover:opacity-95 transition disabled:opacity-60"
          >
            {loading ? "Iniciando..." : "Iniciar sesión"}
          </button>
        </form>

        {/* 🔹 RECUPERAR CONTRASEÑA */}
        <div className="mt-8 flex flex-col items-center text-center text-xs text-slate-500 space-y-2">

          {/* Recuperar contraseña */}
          <div>
            ¿Olvidaste tu contraseña?{" "}
            <Link
              to="/forgot-password"
              className="font-semibold text-sky-600 hover:text-blue-700"
            >
              Recuperar contraseña
            </Link>
          </div>

          {/* Crear cuenta */}
          <div>
            ¿No tienes cuenta?{" "}
            <Link
              to="/registro"
              className="font-semibold text-sky-600 hover:text-blue-700"
            >
              Crear cuenta
            </Link>
          </div>

          {/* Acceso veterinario */}
          <div>
            ¿Eres veterinario?{" "}
            <Link
              to="/login/veterinario"
              className="font-semibold text-sky-600 hover:text-blue-700"
            >
              Ir al acceso de veterinario
            </Link>
          </div>
        </div>

        {/* Volver al inicio */}
        <div className="mt-6 text-center">
          <Link
            to="/"
            className="text-xs font-medium text-sky-600 hover:text-blue-700"
          >
            Volver al inicio
          </Link>
        </div>

      </div>
    </div>
  );
}
