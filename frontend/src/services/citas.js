// src/services/citas.js
import api from "./api";

// Crear una nueva cita — CORREGIDO
export const crearCita = (data) => {
  // data debe ser:
  // {
  //   cliente_id,
  //   mascota_id,
  //   motivo,
  //   inicio,
  //   fin,
  //   box
  // }
  return api.post("/citas/", data);
};

// Reprogramar una cita
export const reprogramarCita = (id, data) => {
  return api.patch(`/citas/${id}/reprogramar/`, data);
};

// Cancelar
export const cancelarCita = (id) => {
  return api.patch(`/citas/${id}/cancelar/`);
};
