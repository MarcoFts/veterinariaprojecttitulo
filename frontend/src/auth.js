// 🔐 Claves de almacenamiento local
export const TOKEN_KEY = "access";
export const REFRESH_KEY = "refresh";

// ✅ Guardar tokens en localStorage
export const setTokens = ({ access, refresh }) => {
  localStorage.setItem(TOKEN_KEY, access);
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
};

// ✅ Obtener tokens
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const getRefresh = () => localStorage.getItem(REFRESH_KEY);

// ✅ Eliminar tokens (cerrar sesión)
export const logout = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
};

// ✅ Realizar peticiones autenticadas al backend
export const authFetch = async (url, options = {}) => {
  const token = getToken();
  const headers = { ...(options.headers || {}), "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, { ...options, headers });
  return res;
};

// ✅ Obtener header de autenticación rápidamente
export const getAuthHeader = () => {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ✅ Refrescar el token de acceso usando el refresh token
export const refreshAccess = async () => {
  const refresh = localStorage.getItem(REFRESH_KEY);
  if (!refresh) return false;

  try {
    const response = await fetch("http://127.0.0.1:8000/api/auth/refresh/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });

    if (!response.ok) return false;

    const data = await response.json();
    localStorage.setItem(TOKEN_KEY, data.access);
    return true;
  } catch (error) {
    console.error("Error refreshing access token:", error);
    return false;
  }
};
