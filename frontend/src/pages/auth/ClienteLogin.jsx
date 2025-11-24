import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function ClienteLogin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // 🔒 FUTURA AUTENTICACIÓN REAL (cuando conectemos backend)
    /*
    const response = await api.loginCliente(form.email, form.password);
    if (response.ok) {
      navigate("/cliente/home");
    } else {
      setError("Credenciales incorrectas");
    }
    */

    // 👉 NAVEGACIÓN TEMPORAL (solo frontend)
    navigate("/cliente/home");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
        {/* ENCABEZADO */}
        <div className="mb-6 text-center">
          <p className="text-xs font-semibold tracking-[0.25em] uppercase text-sky-600 mb-2">
            VETCARE · CLIENTE
          </p>
          <h1 className="text-2xl font-bold text-slate-900">
            Iniciar sesión como Cliente
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Ingresa con tus datos para gestionar tus mascotas y citas.
          </p>
        </div>

        {/* FORMULARIO */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* EMAIL */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-slate-700"
            >
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
              // required  ← se activará cuando el backend esté listo
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
              value={form.password}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm bg-slate-50 
              focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="••••••••"
              // required  ← se activará cuando el backend esté listo
            />
          </div>

          {/* OLVIDÉ CONTRASEÑA */}
          <div className="flex justify-end">
            <Link
              to="/recuperar-cliente"
              className="text-xs font-medium text-sky-600 hover:text-blue-700"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          {/* BOTÓN */}
          <button
            type="submit"
            className="w-full mt-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white 
            text-sm font-semibold py-2.5 shadow-md hover:shadow-lg hover:opacity-95 transition"
          >
            Iniciar sesión
          </button>
        </form>

        {/* REGISTRO / CAMBIO DE ACCESO */}
        <div className="mt-6 text-center text-xs text-slate-500">
          ¿No tienes cuenta?{" "}
          <Link
            to="/registro"
            className="font-semibold text-sky-600 hover:text-blue-700"
          >
            Crear cuenta
          </Link>
        </div>

        <div className="mt-2 text-center text-xs text-slate-500">
          ¿Eres veterinario?{" "}
          <Link
            to="/login/veterinario"
            className="font-semibold text-sky-600 hover:text-blue-700"
          >
            Ir al acceso de veterinario
          </Link>
        </div>

        <p className="mt-3 text-[11px] text-slate-400 text-center">
          *Este formulario por ahora solo maneja navegación en frontend. La
          autenticación real se conectará al backend en el futuro.*
        </p>
      </div>
    </div>
  );
}
