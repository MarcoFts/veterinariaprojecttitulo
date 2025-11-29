// src/services/citas.js
import api from "./api";

// Obtener slots generados para una fecha (agenda del día)
export const getSlotsPorFecha = (fecha) => {
  // Ej: /api/citas/slots/?fecha=2025-11-29
  return api.get(`/citas/slots/`, { params: { fecha } });
};

// Crear una nueva cita
export const crearCita = (data) => {
  // data: { slot_id, cliente_id, mascota_id, motivo, box }
  return api.post("/citas/", data);
};

// Reprogramar una cita existente
export const reprogramarCita = (id, data) => {
  // data: { nueva_fecha, nueva_hora }
  return api.put(`/citas/${id}/`, data);
};

// Cancelar una cita
export const cancelarCita = (id) => {
  return api.delete(`/citas/${id}/`);
};
