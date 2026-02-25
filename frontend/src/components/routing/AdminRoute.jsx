import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function AdminRoute() {
  const { user, loading } = useAuth();

  if (loading) return null;

  // Solo admin (staff)
  if (!user || !user.is_staff) {
    return <Navigate to="/login/admin" replace />;
  }

  return <Outlet />;
}
