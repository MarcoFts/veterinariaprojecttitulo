import { useEffect, useState } from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import { isAuthenticated, refreshAccess } from "../auth";

export default function RequireAuth() {
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    const check = async () => {
      if (isAuthenticated()) {
        setOk(true);
        setChecking(false);
        return;
      }

      const refreshed = await refreshAccess();
      setOk(refreshed);
      setChecking(false);
    };

    check();
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Cargando sesión...
      </div>
    );
  }

  if (!ok) {
    return <Navigate to="/login/cliente" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
