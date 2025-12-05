// src/pages/veterinario/ConfigMotivosConsulta.jsx
import { useEffect, useState } from "react";
import { getMotivosConsulta, crearMotivoConsulta } from "../../services/api";

export default function ConfigMotivosConsulta() {
  const [motivos, setMotivos] = useState([]);
  const [nombre, setNombre] = useState("");
  const [codigo, setCodigo] = useState("");
  const [loading, setLoading] = useState(false);

  const cargar = async () => {
    const res = await getMotivosConsulta();
    setMotivos(res.data || []);
  };

  useEffect(() => {
    cargar();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    const payload = {
      nombre: nombre.trim(),
      codigo: codigo.trim() || nombre.toLowerCase().replace(/\s+/g, "_"),
    };

    setLoading(true);
    try {
      await crearMotivoConsulta(payload);
      setNombre("");
      setCodigo("");
      await cargar();
    } catch (err) {
      console.error(err);
      alert("No se pudo crear el motivo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Motivos de consulta</h1>

      <form onSubmit={handleSubmit} className="flex gap-2 items-end">
        <div className="flex-1">
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Nombre del motivo
          </label>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm"
            placeholder="Ej: Trauma / accidente"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Código (opcional)
          </label>
          <input
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            className="w-40 border rounded-lg px-3 py-2 text-sm"
            placeholder="trauma_accidente"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 text-sm rounded-lg bg-sky-600 text-white"
        >
          {loading ? "Guardando..." : "Agregar"}
        </button>
      </form>

      <div className="border rounded-xl p-3 text-sm">
        <p className="text-xs font-semibold text-slate-500 mb-2">
          Motivos disponibles:
        </p>
        <ul className="space-y-1">
          {motivos.map((m) => (
            <li key={m.id || m.codigo}>
              <span className="font-semibold">{m.nombre}</span>{" "}
              <span className="text-xs text-slate-400">
                ({m.codigo})
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
