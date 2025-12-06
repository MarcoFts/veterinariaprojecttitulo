// src/components/routing/VetRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function VetRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-500 text-sm">Cargando sesión...</p>
      </div>
    );
  }

  const esVet = user && (user.is_vet === true || user.is_staff === true);

  if (!esVet) {
    return <Navigate to="/login/veterinario" replace />;
  }

  return children;
}
