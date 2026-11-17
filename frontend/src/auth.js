// frontend/src/auth.js

const ACCESS_KEY = "access";
const REFRESH_KEY = "refresh";

// Guardar tokens
export const setTokens = ({ access, refresh }) => {
  if (access) localStorage.setItem(ACCESS_KEY, access);
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
};

// Obtener tokens
export const getAccessToken = () => localStorage.getItem(ACCESS_KEY);
export const getRefreshToken = () => localStorage.getItem(REFRESH_KEY);

// Compat con código viejo
export const getToken = getAccessToken;
export const getRefresh = getRefreshToken;

// Logout limpio
export const clearTokens = () => {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
};

export const logout = clearTokens;

// Estado auth simple
export const isAuthenticated = () => Boolean(getAccessToken());

// fetch autenticado (por si lo usas fuera de axios)
export const authFetch = async (url, options = {}) => {
  const t = getAccessToken();
  const headers = {
    ...(options.headers || {}),
    "Content-Type": "application/json",
  };
  if (t) headers.Authorization = `Bearer ${t}`;
  return fetch(url, { ...options, headers });
};

// Refrescar access manual (para RequireAuth)
export const refreshAccess = async () => {
  const refresh = getRefreshToken();
  if (!refresh) return false;

  try {
    const res = await fetch("http://localhost:8000/api/auth/refresh/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });

    if (!res.ok) return false;

    const data = await res.json();
    if (data?.access) {
      localStorage.setItem(ACCESS_KEY, data.access);
      return true;
    }
    return false;
  } catch {
    return false;
  }
};
