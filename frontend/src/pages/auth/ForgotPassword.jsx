import { useState } from "react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("http://127.0.0.1:8000/api/auth/password-reset/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage("✔ Se envió un enlace a tu correo para restablecer la contraseña.");
      } else {
        setMessage(data.error || data.detail || "Error al procesar la solicitud.");
      }
    } catch (err) {
      setMessage("⚠ Error de conexión con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="bg-white shadow-xl rounded-3xl p-8 w-full max-w-md border border-slate-200">

        <h2 className="text-2xl font-bold text-center text-sky-600 mb-3">
          Recuperar contraseña
        </h2>

        <p className="text-slate-600 text-center text-sm mb-6">
          Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-slate-300 rounded-xl p-3 bg-slate-50 
            focus:outline-none focus:ring-2 focus:ring-sky-500"
            required
          />

          <button
            disabled={loading}
            className="bg-gradient-to-r from-sky-500 to-blue-600 text-white font-semibold py-3 rounded-xl 
            hover:opacity-90 transition shadow-md disabled:opacity-60"
          >
            {loading ? "Enviando..." : "Enviar enlace"}
          </button>
        </form>

        {message && (
          <p className="mt-4 text-center text-slate-700 text-sm">{message}</p>
        )}

        <div className="mt-6 text-center">
          <a
            href="/login/cliente"
            className="text-xs font-medium text-sky-600 hover:text-blue-700"
          >
            Volver al login
          </a>
        </div>

      </div>
    </div>
  );
}
