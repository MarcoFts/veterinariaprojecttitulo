// src/components/routing/ClienteRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function ClienteRoute({ children }) {
  const { user, loading } = useAuth();

  // Mientras vemos si hay sesión, no redirigimos
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-500 text-sm">Cargando sesión...</p>
      </div>
    );
  }

  // Sin usuario o sin cliente_id -> al login de cliente
  if (!user || !user.cliente_id) {
    return <Navigate to="/login/cliente" replace />;
  }

  return children;
}
