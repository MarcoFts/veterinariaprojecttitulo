import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function ResetPassword() {
  const { uidb64, token } = useParams();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(
        `http://127.0.0.1:8000/api/auth/password-reset-confirm/${uidb64}/${token}/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            new_password: newPassword,
            confirm_password: confirmPassword,
          }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        setMessage("✔ Contraseña restablecida correctamente. Redirigiendo…");
        setTimeout(() => navigate("/login/cliente"), 2000);
      } else {
        setMessage(data.error || "Error al restablecer la contraseña.");
      }
    } catch (err) {
      setMessage("⚠ Error de conexión con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 p-8">

        <div className="mb-6 text-center">
          <p className="text-xs font-semibold tracking-[0.25em] uppercase text-sky-600 mb-2">
            VETYON
          </p>
          <h1 className="text-2xl font-bold text-slate-900">
            Restablecer contraseña
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Ingresa tu nueva contraseña para continuar.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Nueva contraseña
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm bg-slate-50 
              focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="••••••••"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Confirmar contraseña
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm bg-slate-50 
              focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            disabled={loading}
            className="w-full mt-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white 
            text-sm font-semibold py-2.5 shadow-md hover:shadow-lg hover:opacity-95 transition disabled:opacity-60"
          >
            {loading ? "Actualizando..." : "Cambiar contraseña"}
          </button>
        </form>

        {message && (
          <p className="mt-4 text-center text-sm text-slate-700">{message}</p>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate("/login/cliente")}
            className="text-xs font-medium text-sky-600 hover:text-blue-700"
          >
            Volver al inicio
          </button>
        </div>

      </div>
    </div>
  );
}
