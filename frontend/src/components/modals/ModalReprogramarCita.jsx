import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getCita,
  getDisponibilidad,
  reprogramarCita,
} from "../../services/api";

export default function ReprogramarCita() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [cita, setCita] = useState(null);
  const [fecha, setFecha] = useState("");
  const [horasDisponibles, setHorasDisponibles] = useState([]);
  const [horaSeleccionada, setHoraSeleccionada] = useState("");
  const [loading, setLoading] = useState(false);

  const cargarCita = async () => {
    const res = await getCita(id);
    setCita(res.data);
    const fechaISO = res.data.fecha.split("T")[0];
    setFecha(fechaISO);
  };

  useEffect(() => {
    cargarCita();
  }, [id]);

  // cada vez que cambie fecha o veterinario, pide disponibilidad
  useEffect(() => {
    const fetchDisponibilidad = async () => {
      if (!fecha || !cita?.veterinario) return;
  
      try {
        const res = await getDisponibilidad({
          fecha,
          veterinario_id: cita.veterinario.id ?? cita.veterinario, 
          duracion: cita.duracion || 30,
          box: cita.box || "BOX-1",
        });
  
        // adapta según backend: si responde { horas: [...] }
        setHorasDisponibles(res.data.horas || []);
      } catch (err) {
        console.error(err);
        setHorasDisponibles([]);
      }
    };
  
    fetchDisponibilidad();
  }, [fecha, cita]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!horaSeleccionada) return;
  
    setLoading(true);
  
    try {
      const inicio = `${fecha}T${horaSeleccionada}:00`; // "YYYY-MM-DDTHH:MM:SS"
  
      await reprogramarCita(cita.id, {
        inicio,
        duracion: cita.duracion || 30,
        box: cita.box || "BOX-1",
      });
  
      // después de reprogramar, vuelve a la lista de citas del cliente/vet
      navigate(-1); // o navigate("/cliente/citas") / "/vet/citas" según tu ruta
    } catch (err) {
      console.error(err);
      alert("No se pudo reprogramar la cita. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };
  
  if (!cita) return null;

  return (
    <div className="max-w-xl mx-auto bg-white rounded-xl shadow p-6">
      <h1 className="text-xl font-semibold mb-4">Reprogramar cita</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Fecha</label>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Horario disponible
          </label>
          {horasDisponibles.length === 0 ? (
            <p className="text-sm text-gray-500">
              No hay horas disponibles para esta fecha.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {horasDisponibles.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setHoraSeleccionada(h)}
                  className={`px-3 py-1 rounded-full text-sm border ${
                    horaSeleccionada === h
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-white text-gray-700"
                  }`}
                >
                  {h}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 text-sm rounded-md border"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || !horaSeleccionada}
            className="px-4 py-2 text-sm rounded-md bg-emerald-600 text-white disabled:opacity-60"
          >
            {loading ? "Guardando..." : "Confirmar cambio"}
          </button>
        </div>
      </form>
    </div>
  );
}
