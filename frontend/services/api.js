const BASE = "http://localhost:8000/api";

export async function register(payload) {
  const res = await fetch(`${BASE}/auth/register/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || Object.values(data)[0]?.[0] || "Error al registrarse");
  return data;
}

export async function login(email, password) {
  const res = await fetch(`${BASE}/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Credenciales inválidas");
  return data; // {access, refresh}
}

export function saveTokens({ access, refresh }) {
  localStorage.setItem("access", access);
  localStorage.setItem("refresh", refresh);
}
export function getAuthHeader() {
  const t = localStorage.getItem("access");
  return t ? { Authorization: `Bearer ${t}` } : {};
}
