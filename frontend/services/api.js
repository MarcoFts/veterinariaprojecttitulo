// frontend/services/api.js
import axios from "axios";

// --- claves de storage (coinciden con tu auth.js) ---
const ACCESS_KEY = "access";
const REFRESH_KEY = "refresh";

export const getAccess = () => localStorage.getItem(ACCESS_KEY);
export const getRefresh = () => localStorage.getItem(REFRESH_KEY);
export const saveTokens = ({ access, refresh }) => {
  if (access) localStorage.setItem(ACCESS_KEY, access);
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
};
export const clearTokens = () => {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
};

// --- instancia axios ---
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api",
  timeout: 15000,
});

// --- interceptor: adjunta Authorization ---
api.interceptors.request.use((config) => {
  const t = getAccess();
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

// --- refresh automático en 401 ---
let refreshing = null;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const status = error?.response?.status;

    // ya intentado? evita bucle
    if (status === 401 && !original._retry) {
      original._retry = true;

      const refresh = getRefresh();
      if (!refresh) {
        clearTokens();
        return Promise.reject(error);
      }

      try {
        // serializa refresh si varios 401 llegan juntos
        if (!refreshing) {
          refreshing = api.post("/auth/refresh/", { refresh });
        }
        const resp = await refreshing;
        refreshing = null;

        const newAccess = resp?.data?.access;
        if (!newAccess) throw new Error("No access in refresh response");

        saveTokens({ access: newAccess });
        // reintenta petición original con nuevo token
        original.headers.Authorization = `Bearer ${newAccess}`;
        return api.request(original);
      } catch (e) {
        refreshing = null;
        clearTokens();
        return Promise.reject(e);
      }
    }

    return Promise.reject(error);
  }
);

// ------------ endpoints ------------

// auth
export function register(payload) { return api.post("/auth/register/", payload); }
export const registerUser = register; // ← alias para compatibilidad
export function login(email, password) { return api.post("/auth/login/", { email, password }); }
export function me() { return api.get("/auth/me/"); }

// clientes/mascotas
export function getClientes(params) { return api.get("/clientes/", { params }); }
export function getMascotas(params) { return api.get("/mascotas/", { params }); }

// citas
export function getCitas(params) { return api.get("/citas/", { params }); }
export function crearCita(payload) { return api.post("/citas/", payload); }
export function confirmarCita(id) { return api.patch(`/citas/${id}/confirmar/`); }
export function cancelarCita(id) { return api.patch(`/citas/${id}/cancelar/`); }

// agenda
export function getVeterinarios() { return api.get("/veterinarios/"); }
export function getDisponibilidad({ veterinario_id, fecha, duracion, box }) {
  return api.get("/agenda/disponibilidad/", { params: { veterinario_id, fecha, duracion, box } });
}

export default api;

