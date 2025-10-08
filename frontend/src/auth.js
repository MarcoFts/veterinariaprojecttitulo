export const TOKEN_KEY = "access_token";
export const REFRESH_KEY = "refresh_token";

export function setTokens({ access, refresh }) {
  localStorage.setItem(TOKEN_KEY, access);
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
}
export function getToken() { return localStorage.getItem(TOKEN_KEY); }
export function getRefresh() { return localStorage.getItem(REFRESH_KEY); }
export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export async function authFetch(url, options = {}) {
  const token = getToken();
  const headers = { ...(options.headers || {}), "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, { ...options, headers });
  return res;
}
export const setTokens = ({access, refresh}) => {
  localStorage.setItem('access', access);
  localStorage.setItem('refresh', refresh);
};
export const getAuthHeader = () => {
  const t = localStorage.getItem('access');
  return t ? { Authorization: `Bearer ${t}` } : {};
};
export const logout = () => {
  localStorage.removeItem('access');
  localStorage.removeItem('refresh');
};

export const refreshAccess = async () => {
  const refresh = localStorage.getItem('refresh');
  if (!refresh) return false;
  const r = await fetch('http://127.0.0.1:8000/api/auth/refresh/', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ refresh }),
  });
  if (!r.ok) return false;
  const data = await r.json();
  localStorage.setItem('access', data.access);
  return true;
};