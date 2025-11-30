// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import { getTokens, clearTokens } from "../auth";

const AuthContext = createContext({
  user: null,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // Al montar, sólo comprobamos si hay token; si no hay, dejamos user en null.
  useEffect(() => {
    const tokens = getTokens();
    if (!tokens?.access) {
      setUser(null);
    }
    // Si quieres, aquí podrías llamar /auth/me/ para hidratar el usuario al recargar.
  }, []);

  // Se usa en ClienteLogin / VeterinarioLogin
  const login = (userData) => {
    setUser(userData);
  };

  const logout = () => {
    clearTokens();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
