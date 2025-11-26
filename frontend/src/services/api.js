// frontend/src/services/api.js
import axios from "axios";
import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  logout,
} from "../auth";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
});

// --- interceptor request: adjunta Authorization siempre ---
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- login ---
export const login = (email, password) =>
  api.post("/auth/login/", { email, password });

// --- refresh automático en 401 (robusto) ---
let refreshingPromise = null;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const status = error?.response?.status;

    // si es login o refresh y falla, no intentes refrescar
    if (
      original?.url?.includes("/auth/login/") ||
      original?.url?.includes("/auth/refresh/")
    ) {
      return Promise.reject(error);
    }

    if (status === 401 && !original._retry) {
      original._retry = true;

      const refresh = getRefreshToken();
      if (!refresh) {
        logout();
        return Promise.reject(error);
      }

      try {
        if (!refreshingPromise) {
          const plain = axios.create({
            baseURL: "http://127.0.0.1:8000/api",
          });
          refreshingPromise = plain.post("/auth/refresh/", { refresh });
        }

        const resp = await refreshingPromise;
        refreshingPromise = null;

        const newAccess = resp?.data?.access;
        if (!newAccess) throw new Error("No access token in refresh response");

        setTokens({ access: newAccess, refresh });

        original.headers.Authorization = `Bearer ${newAccess}`;
        return api.request(original);
      } catch (e) {
        refreshingPromise = null;
        logout();
        return Promise.reject(e);
      }
    }

    return Promise.reject(error);
  }
);

// ------------ endpoints ------------

// auth
export function register(payload) {
  return api.post("/auth/register/", payload);
}
export const registerUser = register;
export function me() {
  return api.get("/auth/me/");
}
export const getUserProfile = me;

// clientes/mascotas
export function getClientes(params) {
  return api.get("/clientes/", { params });
}
export function getMascotas(params) {
  return api.get("/mascotas/", { params });
}
export function crearMascota(payload) {
  return api.post("/mascotas/", payload);
}

// citas
export function getCitas(params) {
  return api.get("/citas/", { params });
}
export function crearCita(payload) {
  return api.post("/citas/", payload);
}
export function confirmarCita(id) {
  return api.patch(`/citas/${id}/confirmar/`);
}
export function cancelarCita(id) {
  return api.patch(`/citas/${id}/cancelar/`);
}

// agenda
export function getVeterinarios() {
  return api.get("/veterinarios/");
}
export function getDisponibilidad({ veterinario_id, fecha, duracion, box }) {
  return api.get("/agenda/disponibilidad/", {
    params: { veterinario_id, fecha, duracion, box },
  });
}

export default api;
