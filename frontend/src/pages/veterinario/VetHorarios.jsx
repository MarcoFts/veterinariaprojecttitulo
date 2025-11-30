// src/pages/veterinario/VetHorarios.jsx
import { useEffect, useState } from "react";
import LayoutVeterinario from "../../components/layout/LayoutVet";
import {
  getHorarios,
  crearHorario,
  eliminarHorario,
} from "../../services/api";

const DIAS = [
  { value: 0, label: "Lunes" },
  { value: 1, label: "Martes" },
  { value: 2, label: "Miércoles" },
  { value: 3, label: "Jueves" },
  { value: 4, label: "Viernes" },
  { value: 5, label: "Sábado" },
  { value: 6, label: "Domingo" },
];

export default function VetHorarios() {
  const [horarios, setHorarios] = useState([]);
  const [form, setForm] = useState({
    dia_semana: 0,
    hora_inicio: "09:00",
    hora_fin: "18:00",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const cargarHorarios = async () => {
    try {
      const res = await getHorarios();
      setHorarios(res.data);
    } catch (e) {
      console.error(e);
      setError("No se pudieron cargar los horarios.");
    }
  };

  useEffect(() => {
    cargarHorarios();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCrear = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await crearHorario(form);
      setForm({
        dia_semana: 0,
        hora_inicio: "09:00",
        hora_fin: "18:00",
      });
      await cargarHorarios();
    } catch (e) {
      console.error(e);
      setError("No se pudo crear el horario. Revisa que no se solape con otro.");
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm("¿Eliminar este horario?")) return;
    try {
      await eliminarHorario(id);
      await cargarHorarios();
    } catch (e) {
      console.error(e);
      setError("No se pudo eliminar el horario.");
    }
  };

  const nombreDia = (d) => DIAS.find((x) => x.value === d)?.label ?? d;

  return (
    <LayoutVeterinario titulo="Mis horarios de atención">
      <div className="space-y-6">
        <section className="bg-white rounded-xl shadow p-4">
          <h2 className="text-lg font-semibold mb-3">Agregar horario</h2>

          {error && (
            <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <form onSubmit={handleCrear} className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-sm font-medium mb-1">Día</label>
              <select
                name="dia_semana"
                value={form.dia_semana}
                onChange={handleChange}
                className="border rounded-md px-2 py-1 text-sm"
              >
                {DIAS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Hora inicio
              </label>
              <input
                type="time"
                name="hora_inicio"
                value={form.hora_inicio}
                onChange={handleChange}
                className="border rounded-md px-2 py-1 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Hora fin</label>
              <input
                type="time"
                name="hora_fin"
                value={form.hora_fin}
                onChange={handleChange}
                className="border rounded-md px-2 py-1 text-sm"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm rounded-md bg-emerald-600 text-white"
            >
              {loading ? "Guardando..." : "Agregar"}
            </button>
          </form>
        </section>

        <section className="bg-white rounded-xl shadow p-4">
          <h2 className="text-lg font-semibold mb-3">Horarios registrados</h2>

          {horarios.length === 0 ? (
            <p className="text-sm text-gray-500">
              Aún no tienes horarios configurados.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Día</th>
                  <th className="text-left py-2">Inicio</th>
                  <th className="text-left py-2">Fin</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {horarios.map((h) => (
                  <tr key={h.id} className="border-b last:border-0">
                    <td className="py-1">{nombreDia(h.dia_semana)}</td>
                    <td className="py-1">{h.hora_inicio}</td>
                    <td className="py-1">{h.hora_fin}</td>
                    <td className="py-1 text-right">
                      <button
                        onClick={() => handleEliminar(h.id)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </LayoutVeterinario>
  );
}
