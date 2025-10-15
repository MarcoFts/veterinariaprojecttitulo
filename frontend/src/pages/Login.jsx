import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login, saveTokens } from "../../services/api"; // ← usamos saveTokens

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const { data } = await login(email.trim(), password); // AxiosResponse
      const tokens = data?.tokens ? data.tokens : data;     // {access,refresh}
      saveTokens(tokens);                                   // guarda en localStorage
      navigate("/citas");
    } catch (error) {
      const data = error?.response?.data;
      const msg =
        data?.detail ||
        data?.email?.[0] ||
        data?.password?.[0] ||
        data?.non_field_errors?.[0] ||
        "Credenciales inválidas";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[80vh] grid md:grid-cols-2 bg-[#f2fffc]">
      <section className="p-8 md:p-12 max-w-xl w-full mx-auto">
        <h1 className="font-display text-3xl md:text-4xl font-extrabold mb-6 text-slate-900">
          Iniciar sesión
        </h1>

        {err && (
          <div className="mb-4 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
            {err}
          </div>
        )}

        <form onSubmit={submit} className="space-y-4" noValidate>
          <label className="block">
            <span className="block text-sm text-slate-600 mb-1">Email</span>
            <input
              className="w-full border border-slate-300 rounded-xl p-3 text-sm bg-white focus:ring-2 ring-emerald-100 outline-none"
              type="email"
              name="email"
              placeholder="tu@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </label>

          <label className="block">
            <span className="block text-sm text-slate-600 mb-1">Contraseña</span>
            <div className="flex gap-2">
              <input
                className="w-full border border-slate-300 rounded-xl p-3 text-sm bg-white focus:ring-2 ring-emerald-100 outline-none"
                type={showPwd ? "text" : "password"}
                name="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="px-3 text-xs text-slate-500 hover:text-slate-700"
                aria-label={showPwd ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPwd ? "Ocultar" : "Ver"}
              </button>
            </div>
          </label>

          <button
            disabled={loading}
            className={`w-full px-6 py-3 rounded-full text-white shadow-lg transition
              ${
                loading
                  ? "bg-emerald-300 cursor-not-allowed"
                  : "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
              }`}
          >
            {loading ? "Ingresando…" : "Iniciar sesión"}
          </button>

          {/* 🔑 Enlace de recuperación de contraseña */}
          <div className="text-right">
            <Link
              to="/forgot-password"
              className="text-sm text-emerald-600 hover:text-emerald-700 underline"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <p className="text-sm text-slate-600 text-center">
            ¿No tienes cuenta?{" "}
            <Link
              to="/registro"
              className="text-emerald-600 hover:text-emerald-700 underline"
            >
              Regístrate
            </Link>
          </p>
        </form>
      </section>

      <section className="hidden md:block relative">
        <div className="absolute inset-0 bg-slate-400/70 rounded-l-2xl" />
        <div className="absolute bottom-8 left-8 right-8 text-white">
          <h2 className="text-4xl font-extrabold drop-shadow">
            El mejor cuidado para tu mascota
          </h2>
          <p className="text-white/90 mt-2">
            Agenda, historial y recordatorios en un solo lugar.
          </p>
        </div>
      </section>
    </main>
  );
}
