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
        setMessage("✅ Contraseña restablecida correctamente.");
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setMessage(data.error || "Error al restablecer la contraseña.");
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
          Restablecer contraseña
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="password"
            placeholder="Nueva contraseña"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            required
          />
          <input
            type="password"
            placeholder="Confirmar contraseña"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            required
          />
          <button
            disabled={loading}
            className="bg-emerald-500 text-white font-semibold py-2 rounded-lg hover:bg-emerald-600 transition"
          >
            {loading ? "Actualizando..." : "Cambiar contraseña"}
          </button>
        </form>
        {message && <p className="mt-4 text-center text-gray-700">{message}</p>}
      </div>
    </div>
  );
}
