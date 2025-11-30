import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function ClienteRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-500 text-sm">Cargando sesión…</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login/cliente" replace />;
  }

  // Consideramos cliente si tiene cliente_id o rol explícito
  const esCliente =
    user.cliente_id != null || user.rol === "cliente" || user.is_vet === false;

  if (!esCliente) {
    return <Navigate to="/login/cliente" replace />;
  }

  return <Outlet />;
}
