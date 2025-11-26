import LayoutCliente from "../../components/layout/LayoutCliente";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  PawPrint,
  Dog,
  Cat,
  CalendarDays,
  Weight,
  ShieldCheck,
  ScanLine,
  FileText,
} from "lucide-react";
import api from "../../services/api"; // instancia axios

export default function RegistrarMascota() {
  const navigate = useNavigate();

  const [pet, setPet] = useState({
    nombre: "",
    especie: "",
    raza: "",
    sexo: "",
    fechaNacimiento: "",
    peso: "",
    esterilizado: false,
    microchip: "",
    notas: "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPet((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
  
    try {
      const payload = {
        nombre: pet.nombre,
        especie: pet.especie,
        raza: pet.raza || null,
        sexo:
          pet.sexo === "macho"
            ? "Macho"
            : pet.sexo === "hembra"
            ? "Hembra"
            : "No informado",
        fecha_nacimiento: pet.fechaNacimiento || null,
        peso_kg: pet.peso ? Number(pet.peso) : null,
        esterilizado: !!pet.esterilizado,
        microchip: pet.microchip || null,
        notas_salud: pet.notas || "",
      };
  
      await api.post("/mascotas/", payload);
  
      setSaving(false);
      navigate("/cliente/home"); // <- IMPORTANTE: ruta existe
    } catch (err) {
      setSaving(false);
      setError("No se pudo registrar la mascota.");
      console.log(err?.response?.data);
    }
  };  
  
  return (
    <LayoutCliente>
      <div className="space-y-8">
        {/* Encabezado */}
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.25em] text-sky-600 uppercase mb-1">
              VetCare · Cliente
            </p>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                <PawPrint size={20} />
              </span>
              <span>Registrar mascota</span>
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Ingresa los datos básicos de tu mascota para poder agendar citas y
              llevar su historial.
            </p>
          </div>

          <div className="hidden md:flex items-center gap-3 text-xs text-slate-500 bg-white/70 backdrop-blur-md rounded-xl px-4 py-2 shadow-sm border border-slate-100">
            <ShieldCheck size={16} className="text-sky-500" />
            <span>
              Los datos se vincularán a tu cuenta cuando el backend esté
              conectado.
            </span>
          </div>
        </header>

        {/* Formulario */}
        <section className="bg-white/60 backdrop-blur-md rounded-2xl shadow-xl border border-white/60 p-5 md:p-6">
          <form onSubmit={handleSubmit} className="space-y-5 text-sm">
            {/* Nombre / especie / raza */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-medium text-slate-600 flex items-center gap-1">
                  <PawPrint size={14} className="text-sky-500" />
                  Nombre de la mascota
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={pet.nombre}
                  onChange={handleChange}
                  placeholder="Ej: Max, Luna, Rocky..."
                  className="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600 flex items-center gap-1">
                  <Dog size={14} className="text-sky-500" />
                  Especie
                </label>
                <select
                  name="especie"
                  value={pet.especie}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
                >
                  <option value="">Seleccionar especie</option>
                  <option value="perro">Perro</option>
                  <option value="gato">Gato</option>
                  <option value="otro">Otro</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600 flex items-center gap-1">
                  <Cat size={14} className="text-sky-500" />
                  Raza
                </label>
                <input
                  type="text"
                  name="raza"
                  value={pet.raza}
                  onChange={handleChange}
                  placeholder="Ej: Mestizo, Labrador, Siamés..."
                  className="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
                />
              </div>
            </div>

            {/* Sexo / fecha nacimiento */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600">
                  Sexo
                </label>
                <select
                  name="sexo"
                  value={pet.sexo}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
                >
                  <option value="">Seleccionar</option>
                  <option value="hembra">Hembra</option>
                  <option value="macho">Macho</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600 flex items-center gap-1">
                  <CalendarDays size={14} className="text-sky-500" />
                  Fecha de nacimiento
                </label>
                <input
                  type="date"
                  name="fechaNacimiento"
                  value={pet.fechaNacimiento}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
                />
              </div>
            </div>

            {/* Peso / esterilizado */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600 flex items-center gap-1">
                  <Weight size={14} className="text-sky-500" />
                  Peso aproximado (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="peso"
                  value={pet.peso}
                  onChange={handleChange}
                  placeholder="Ej: 4.5"
                  className="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
                />
              </div>

              <div className="flex items-center gap-2 mt-4 md:mt-7">
                <input
                  id="esterilizado"
                  type="checkbox"
                  name="esterilizado"
                  checked={pet.esterilizado}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-300"
                />
                <label
                  htmlFor="esterilizado"
                  className="text-xs font-medium text-slate-600 flex items-center gap-1"
                >
                  <ShieldCheck size={14} className="text-sky-500" />
                  Esterilizado
                </label>
              </div>
            </div>

            {/* Microchip */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600 flex items-center gap-1">
                <ScanLine size={14} className="text-sky-500" />
                Microchip{" "}
                <span className="text-[11px] text-slate-400">(opcional)</span>
              </label>
              <input
                type="text"
                name="microchip"
                value={pet.microchip}
                onChange={handleChange}
                placeholder="Código de microchip si lo tiene"
                className="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
              />
            </div>

            {/* Notas */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600 flex items-center gap-1">
                <FileText size={14} className="text-sky-500" />
                Notas o comentarios de salud
              </label>
              <textarea
                name="notas"
                value={pet.notas}
                onChange={handleChange}
                rows={4}
                placeholder="Alergias, medicamentos, enfermedades crónicas, indicaciones del veterinario, etc."
                className="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-300 resize-none"
              />
            </div>

            {/* Error */}
            {error && (
              <p className="text-red-600 text-sm mt-2">{error}</p>
            )}

            {/* Footer / CTA */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pt-2">
              <p className="text-[11px] text-slate-400 max-w-md">
                *La información será utilizada para facilitar tus próximas
                reservas y controles. No se compartirá con terceros.
              </p>

              <button
                type="submit"
                disabled={saving}
                className={`inline-flex items-center justify-center rounded-xl px-5 py-2 text-sm font-semibold text-white shadow-md transition ${
                  saving
                    ? "bg-sky-300/80 cursor-not-allowed"
                    : "bg-gradient-to-r from-sky-500 to-blue-600 hover:opacity-90 hover:shadow-lg"
                }`}
              >
                {saving ? "Guardando…" : "Guardar mascota"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </LayoutCliente>
  );
}
