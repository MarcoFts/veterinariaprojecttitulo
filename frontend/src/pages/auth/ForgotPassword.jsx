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
        setMessage("📩 Se envió un enlace a tu correo para restablecer la contraseña.");
      } else {
        setMessage(data.error || data.detail || "Error al procesar la solicitud.");
      }
    } catch (err) {
      setMessage("⚠️ Error de conexión con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-emerald-50">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-96">
        <h2 className="text-2xl font-bold text-center text-emerald-600 mb-6">
          ¿Olvidaste tu contraseña?
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Ingresa tu correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            required
          />
          <button
            disabled={loading}
            className="bg-emerald-500 text-white font-semibold py-2 rounded-lg hover:bg-emerald-600 transition"
          >
            {loading ? "Enviando..." : "Enviar enlace"}
          </button>
        </form>
        {message && <p className="mt-4 text-center text-gray-700">{message}</p>}
      </div>
    </div>
  );
}
