// frontend/src/auth.js

export const TOKEN_KEY = "access";
export const REFRESH_KEY = "refresh";

// guardar tokens
export const setTokens = ({ access, refresh }) => {
  if (access) localStorage.setItem(TOKEN_KEY, access);
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
};

// getters
export const getAccessToken = () => localStorage.getItem(TOKEN_KEY);
export const getRefresh = () => localStorage.getItem(REFRESH_KEY);

// compat para código existente
export const getToken = getAccessToken;

// estado de autenticación
export const isAuthenticated = () => Boolean(getAccessToken());

// logout
export const logout = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
};

// fetch autenticado (si lo necesitas)
export const authFetch = async (url, options = {}) => {
  const t = getAccessToken();
  const headers = { ...(options.headers || {}), "Content-Type": "application/json" };
  if (t) headers.Authorization = `Bearer ${t}`;
  return fetch(url, { ...options, headers });
};

// refrescar access con refresh (opcional)
export const refreshAccess = async () => {
  const refresh = getRefresh();
  if (!refresh) return false;

  try {
    const res = await fetch("http://127.0.0.1:8000/api/auth/refresh/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    if (data?.access) localStorage.setItem(TOKEN_KEY, data.access);
    return Boolean(data?.access);
  } catch {
    return false;
  }
};
