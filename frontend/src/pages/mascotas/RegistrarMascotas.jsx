import LayoutCliente from "../../components/layout/LayoutCliente";
import { useState } from "react";
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

export default function RegistrarMascota() {
  const [pet, setPet] = useState({
    nombre: "",
    especie: "",
    raza: "",
    sexo: "",
    fecha_nacimiento: "",
    peso_kg: "",
    esterilizado: false,
    microchip: "",
    notas_salud: "",
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPet((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // 🔒 Futuro: aquí se conectará con el backend (Django + DRF)
    // Ejemplo:
    // const token = localStorage.getItem("access");
    // await axios.post("/api/mascotas/", pet, { headers: { Authorization: `Bearer ${token}` }});

    console.log("Mascota a enviar al backend:", pet);
    alert("En el futuro esta acción registrará la mascota en VetCare 🐾");

    setPet({
      nombre: "",
      especie: "",
      raza: "",
      sexo: "",
      fecha_nacimiento: "",
      peso_kg: "",
      esterilizado: false,
      microchip: "",
      notas_salud: "",
    });
  };

  return (
    <LayoutCliente>
    <div className="min-h-[80vh] bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        {/* Encabezado */}
        <header className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
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
              Ingresa los datos básicos de tu mascota para poder agendar citas y llevar su historial.
            </p>
          </div>

          <div className="hidden md:flex items-center gap-3 text-xs text-slate-500 bg-white rounded-xl px-4 py-2 shadow-sm border border-slate-100">
            <ShieldCheck size={16} className="text-emerald-500" />
            <span>Los datos se vincularán a tu cuenta cuando el backend esté conectado.</span>
          </div>
        </header>

        {/* Tarjeta formulario */}
        <section className="bg-white rounded-2xl shadow-md border border-slate-100 p-5 md:p-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
            {/* Nombre */}
            <div className="md:col-span-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
                <PawPrint size={16} className="text-sky-600" />
                Nombre de la mascota
              </label>
              <input
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                name="nombre"
                placeholder="Ej: Max, Luna, Rocky..."
                value={pet.nombre}
                onChange={handleChange}
                required
              />
            </div>

            {/* Especie */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
                <Dog size={16} className="text-sky-600" />
                Especie
              </label>
              <select
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                name="especie"
                value={pet.especie}
                onChange={handleChange}
                required
              >
                <option value="">Seleccionar especie</option>
                <option value="Perro">Perro</option>
                <option value="Gato">Gato</option>
                <option value="Otro">Otro</option>
              </select>
            </div>

            {/* Raza */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
                <Cat size={16} className="text-sky-600" />
                Raza
              </label>
              <input
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                name="raza"
                placeholder="Ej: Mestizo, Labrador, Siamés..."
                value={pet.raza}
                onChange={handleChange}
              />
            </div>

            {/* Sexo */}
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                Sexo
              </label>
              <select
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                name="sexo"
                value={pet.sexo}
                onChange={handleChange}
              >
                <option value="">Seleccionar</option>
                <option value="Macho">Macho</option>
                <option value="Hembra">Hembra</option>
                <option value="No informado">Prefiero no informar</option>
              </select>
            </div>

            {/* Fecha nacimiento */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
                <CalendarDays size={16} className="text-sky-600" />
                Fecha de nacimiento
              </label>
              <input
                type="date"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                name="fecha_nacimiento"
                value={pet.fecha_nacimiento}
                onChange={handleChange}
              />
            </div>

            {/* Peso */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
                <Weight size={16} className="text-sky-600" />
                Peso aproximado (kg)
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                name="peso_kg"
                placeholder="Ej: 4.5"
                value={pet.peso_kg}
                onChange={handleChange}
              />
            </div>

            {/* Esterilizado */}
            <div className="md:col-span-2 flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                id="esterilizado"
                name="esterilizado"
                checked={pet.esterilizado}
                onChange={handleChange}
                className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-400"
              />
              <label htmlFor="esterilizado" className="text-sm text-slate-700 flex items-center gap-1.5">
                <ShieldCheck size={16} className="text-emerald-500" />
                Esterilizado
              </label>
            </div>

            {/* Microchip */}
            <div className="md:col-span-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
                <ScanLine size={16} className="text-sky-600" />
                Microchip <span className="text-xs font-normal text-slate-400">(opcional)</span>
              </label>
              <input
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                name="microchip"
                placeholder="Código de microchip si lo tiene"
                value={pet.microchip}
                onChange={handleChange}
              />
            </div>

            {/* Notas de salud */}
            <div className="md:col-span-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
                <FileText size={16} className="text-sky-600" />
                Notas o comentarios de salud
              </label>
              <textarea
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 min-h-[90px]"
                name="notas_salud"
                placeholder="Alergias, medicamentos, enfermedades crónicas, indicaciones del veterinario, etc."
                value={pet.notas_salud}
                onChange={handleChange}
              />
            </div>

            {/* CTA */}
            <div className="md:col-span-2 flex items-center justify-between pt-2">
              <p className="text-xs text-slate-500">
                *La información será utilizada para facilitar tus próximas reservas y controles.
              </p>
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-5 py-2 text-sm font-semibold text-white shadow-md hover:bg-emerald-600 hover:shadow-lg transition"
              >
                Guardar mascota
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
    </LayoutCliente>
  );
}
