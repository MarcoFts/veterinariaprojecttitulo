import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function VetRoute() {
  const { user, loading } = useAuth();

  // Mientras se consulta /auth/me
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-500 text-sm">Cargando sesión…</p>
      </div>
    );
  }

  // Si no está logueado → redirigimos al login de vet
  if (!user) {
    return <Navigate to="/login/veterinario" replace />;
  }

  // Validación de rol veterinario
  const esVet =
    user.is_vet === true ||
    user.is_staff === true ||
    user.rol === "veterinario";

  if (!esVet) {
    return <Navigate to="/login/veterinario" replace />;
  }

  // ✅ Si todo ok, renderiza las rutas hijas
  return <Outlet />;
}
