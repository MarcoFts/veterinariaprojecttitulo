// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";
import { getAccessToken, setTokens, clearTokens } from "../auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // login() se usará desde los formularios
  const login = (userData, access, refresh) => {
    if (access) setTokens({ access, refresh });
    setUser(userData);
  };

  const logout = () => {
    clearTokens();
    setUser(null);
  };

  // Al montar la app, si hay token, preguntamos /auth/me/
  useEffect(() => {
    const init = async () => {
      const token = getAccessToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.get("/auth/me/");
        // Ajusta según lo que devuelve tu backend (ya lo vimos en tu views.py)
        setUser({
          id: data.id,
          email: data.email,
          name: data.name,
          is_vet: data.is_vet,
          is_staff: data.is_staff,
          cliente_id: data.cliente_id,
        });
      } catch (err) {
        console.error("Error al recuperar sesión:", err);
        clearTokens();
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
