// frontend/src/services/api.js
import axios from "axios";
import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  logout,
} from "../auth";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api",
  withCredentials: true,
});

// Interceptor request: adjunta Authorization
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Login
export const login = (email, password) =>
  api.post("/auth/login/", { email, password });

// Refresh automático en 401
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
            baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api",
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

// Endpoints API

// auth
export function register(payload) {
  return api.post("/auth/register/", payload);
}
export const registerUser = register;

export function me() {
  return api.get("/auth/me/");
}
export const getUserProfile = me;

export function updateVetProfile(payload) {
  return api.put("/auth/me/update/", payload);
}



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

// detalle de una cita
export function getCita(id) {
  return api.get(`/citas/${id}/`);
}

export function crearCita(payload) {
  return api.post("/citas/", payload);
}

export function confirmarCita(id, payload) {
  return api.patch(`/citas/${id}/confirmar/`, payload);
}

export function cancelarCita(id) {
  return api.patch(`/citas/${id}/cancelar/`);
}

export function reprogramarCita(id, payload) {
  // payload: { inicio: "2025-11-26T10:00", duracion: 30, box: "BOX-1" }
  return api.patch(`/citas/${id}/reprogramar/`, payload);
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

// ficha clínica / registros clínicos
export function getRegistrosClinicos(params) {
  return api.get("/registros-clinicos/", { params });
}

export function crearRegistroClinico(payload) {
  return api.post("/registros-clinicos/", payload);
}

// horarios de atención
export const actualizarHorario = (id, data) =>
  api.put(`/horarios/${id}/`, data);

export const eliminarHorario = (id) => api.delete(`/horarios/${id}/`);

// mascota individual (detalle)
export function getMascota(id) {
  return api.get(`/mascotas/${id}/`);
}

// ---------- HORARIOS DE ATENCIÓN ----------

// Obtener horarios (por defecto el backend ya filtra por vet autenticado)
export function getHorarios(params) {
  return api.get("/horarios/", { params });
}

// Crear un nuevo horario
export function crearHorario(data) {
  // data: { dia_semana, hora_inicio, hora_fin }
  return api.post("/horarios/", data);
}

// ---------- PRODUCTOS / INVENTARIO ----------

// Lista de productos
export function getProductos(params) {
  return api.get("/productos/", { params });
}

// Crear producto
export function crearProducto(data) {
  return api.post("/productos/", data);
}

export const actualizarProducto = (id, payload) =>
  api.patch(`/productos/${id}/`, payload);

export const ajustarStockProducto = (id, delta, motivo = "") =>
  api.post(`/productos/${id}/ajustar_stock/`, { delta, motivo });

// Eliminar producto
export function eliminarProducto(id) {
  return api.delete(`/productos/${id}/`);
}

// Agregar stock
export function agregarStockProducto({ producto_id, cantidad, motivo }) {
  return api.post("/inventario/agregar-stock/", {
    producto_id,
    cantidad,
    motivo,
  });
}

// ---------- MOTIVOS DE CONSULTA ----------

export const getMotivosConsulta = () =>
  api.get("/motivos-consulta/");

export const crearMotivoConsulta = (payload) =>
  api.post("/motivos-consulta/", payload);

export const editarMotivoConsulta = (id, payload) =>
  api.patch(`/motivos-consulta/${id}/`, payload);

export const eliminarMotivoConsulta = (id) =>
  api.delete(`/motivos-consulta/${id}/`);

// ---------- REPORTES (RF06) ----------

export async function getReporteAgenda({ desde, hasta, veterinario_id } = {}) {
  const response = await api.get("/reportes/agenda/", {
    params: {
      desde,
      hasta,
      veterinario_id,
    },
  });
  return response.data;
}

export async function getReporteInventario({ dias_alerta } = {}) {
  const response = await api.get("/reportes/inventario/", {
    params: {
      dias_alerta,
    },
  });
  return response.data;
}

export const atenderCita = (id) =>
  api.patch(`/citas/${id}/atender/`);

export const marcarNoAsistida = (id) =>
  api.patch(`/citas/${id}/no_asistio/`);

// ---------- PERFIL CLIENTE ----------

export function getClientePerfil() {
  return api.get("/auth/cliente/profile/");
}

export function updateClientePerfil(payload) {
  return api.put("/auth/cliente/profile/", payload);
}

export default api;

// mascotas (editar / eliminar)
export function actualizarMascota(id, payload) {
  return api.put(`/mascotas/${id}/`, payload);
}

export function eliminarMascota(id) {
  return api.delete(`/mascotas/${id}/`);
}

// --- Movimientos ---
// src/services/api.js
export const getMovimientos = (params = {}) =>
  api.get("/movimientos/", { params });

export const crearMovimiento = (payload) =>
  api.post("/movimientos/", payload);

// --- Admin: Usuarios ---
export const getAdminUsers = (params = {}) =>
  api.get("/admin/users/", { params });

export const updateUserRole = (userId, role) =>
  api.patch(`/admin/users/${userId}/role/`, { role });

// ---------- ADMIN DASHBOARD ----------
export const getAdminDashboard = () => api.get("/admin/dashboard/");

// --- Notificaciones In-App ---
export const getNotificacionesResumen = () =>
  api.get("/notificaciones/resumen/");

export const marcarNotificacionLeida = (id) =>
  api.patch(`/notificaciones/${id}/leer/`);

export const marcarTodasNotificacionesLeidas = () =>
  api.post("/notificaciones/marcar_todas_leidas/");

export const getNotificaciones = () =>
  api.get("/notificaciones/").then(r => r.data);

export const leerNotificacion = (id) =>
  api.patch(`/notificaciones/${id}/leer/`).then(r => r.data);

export const marcarTodasLeidas = () =>
  api.post("/notificaciones/marcar_todas_leidas/").then(r => r.data);

// ---------- MFA / DOBLE FACTOR (MEJ-02) ----------
export const mfaVerify = (mfaToken, code, rememberDevice = false) =>
  api.post(
    "/auth/mfa/verify/",
    { code, remember_device: rememberDevice },
    { headers: { Authorization: `Bearer ${mfaToken}` } }
  );

export const mfaEnrollStart = (mfaToken) =>
  api.post(
    "/auth/mfa/enroll/start/",
    {},
    mfaToken ? { headers: { Authorization: `Bearer ${mfaToken}` } } : {}
  );

export const mfaEnrollConfirm = (mfaToken, code) =>
  api.post(
    "/auth/mfa/enroll/confirm/",
    { code },
    mfaToken ? { headers: { Authorization: `Bearer ${mfaToken}` } } : {}
  );

export const mfaEnrollPostpone = (mfaToken) =>
  api.post(
    "/auth/mfa/enroll/postpone/",
    {},
    { headers: { Authorization: `Bearer ${mfaToken}` } }
  );

export const mfaStatus = () => api.get("/auth/mfa/status/");

export const mfaRevokeDevice = (id) => api.delete(`/auth/mfa/trusted-devices/${id}/`);

export const mfaRegenerateRecovery = (password) =>
  api.post("/auth/mfa/recovery-codes/regenerate/", { password });

export const adminMfaApi = {
  getSettings: () => api.get("/admin/mfa/settings/"),
  updateSettings: (payload) => api.patch("/admin/mfa/settings/", payload),
  listUsers: (q = "") => api.get("/admin/mfa/users/", { params: q ? { q } : {} }),
  resetUser: (targetUserId, reason) =>
    api.post("/admin/mfa/reset/", { targetUserId, reason }),
  listResetLog: (params = {}) => api.get("/admin/mfa/reset-log/", { params }),
};
