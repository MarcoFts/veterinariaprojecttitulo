import React, { useState, useEffect } from "react";
import {
  PawPrint,
  Dog,
  Cat,
  CalendarDays,
  Weight,
  ShieldCheck,
  ScanLine,
  FileText,
  X,
} from "lucide-react";
import { actualizarMascota } from "../../services/api";

// ---------------------------------------------------------
// HELPERS
// ---------------------------------------------------------
const isFutureDate = (dateStr) => {
  if (!dateStr) return false;
  const today = new Date();
  const selected = new Date(dateStr);
  return selected > today;
};

const calcularEdad = (dateStr) => {
  if (!dateStr) return null;
  const fecha = new Date(dateStr);
  if (isNaN(fecha)) return null;

  const hoy = new Date();
  let edad = hoy.getFullYear() - fecha.getFullYear();
  const m = hoy.getMonth() - fecha.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < fecha.getDate())) {
    edad--;
  }
  return edad;
};

const normalizeSpecies = (value) =>
  value ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase() : "";

const normalizeMicrochip = (value) => {
  if (!value || value.trim() === "") return null;
  const v = value.trim().toLowerCase();

  if (v === "si" || v === "sí") return "Si";
  if (v === "no") return "No";

  return "__INVALID__";
};

// ---------------------------------------------------------
// MODAL
// ---------------------------------------------------------
export default function ModalEditarMascota({
  mascota,
  onClose,
  onUpdated,
}) {
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

  // ---------------------------------------------------------
  // CARGA INICIAL
  // ---------------------------------------------------------
  useEffect(() => {
    if (!mascota) return;

    setPet({
      nombre: mascota.nombre || "",
      especie: mascota.especie?.toLowerCase() || "",
      raza: mascota.raza || "",
      sexo:
        mascota.sexo?.toLowerCase() === "macho"
          ? "macho"
          : mascota.sexo?.toLowerCase() === "hembra"
          ? "hembra"
          : "",
      fechaNacimiento: mascota.fecha_nacimiento || "",
      peso: mascota.peso_kg ?? "",
      esterilizado: !!mascota.esterilizado,
      microchip: mascota.microchip || "",
      notas: mascota.notas_salud || "",
    });
  }, [mascota]);

  // ---------------------------------------------------------
  // VALIDACIONES
  // ---------------------------------------------------------
  const validarFormulario = () => {
    if (!pet.nombre || !pet.nombre.trim()) {
      return "El nombre de la mascota es obligatorio.";
    }

    if (!pet.especie) {
      return "Debes seleccionar una especie válida.";
    }

    if (pet.raza && pet.raza.trim().length > 100) {
      return "La raza no puede superar los 100 caracteres.";
    }

    if (pet.fechaNacimiento) {
      if (isFutureDate(pet.fechaNacimiento)) {
        return "La fecha de nacimiento no puede ser en el futuro.";
      }

      const edad = calcularEdad(pet.fechaNacimiento);
      if (edad !== null && edad > 100) {
        return "La edad de la mascota no es válida (máximo 100 años).";
      }
    }

    if (pet.peso !== "" && pet.peso !== null) {
      const peso = Number(pet.peso);
      if (Number.isNaN(peso)) return "El peso ingresado no es válido.";
      if (peso <= 0) return "El peso debe ser mayor a cero.";
      if (peso > 250) return "El peso no puede superar los 250 kg.";
    }

    const chip = normalizeMicrochip(pet.microchip);
    if (chip === "__INVALID__") {
      return "El microchip solo puede ser 'Si' o 'No' (o dejarse vacío).";
    }

    if (pet.notas && pet.notas.length > 1000) {
      return "Las notas no pueden superar los 1000 caracteres.";
    }

    return null;
  };

  // ---------------------------------------------------------
  // SUBMIT
  // ---------------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const errorValidacion = validarFormulario();
    if (errorValidacion) {
      setSaving(false);
      setError(errorValidacion);
      return;
    }

    try {
      const chip = normalizeMicrochip(pet.microchip);

      const payload = {
        nombre: pet.nombre.trim(),
        especie: normalizeSpecies(pet.especie),
        raza: pet.raza ? pet.raza.trim() : null,
        sexo:
          pet.sexo === "macho"
            ? "Macho"
            : pet.sexo === "hembra"
            ? "Hembra"
            : "No informado",
        fecha_nacimiento: pet.fechaNacimiento || null,
        peso_kg: pet.peso !== "" ? Number(pet.peso) : null,
        esterilizado: !!pet.esterilizado,
        microchip: chip === "__INVALID__" ? null : chip,
        notas_salud: pet.notas || "",
      };

      await actualizarMascota(mascota.id, payload);

      onUpdated(); // refrescar lista
      onClose();
    } catch (err) {
      console.error(err);
      setError("No se pudo actualizar la mascota.");
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-neutral-200 w-full max-w-lg p-5 animate-fadeScale">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <PawPrint size={18} className="text-sky-600" />
            Editar mascota
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          {/* Nombre */}
          <input
            type="text"
            name="nombre"
            value={pet.nombre}
            onChange={(e) => setPet({ ...pet, nombre: e.target.value })}
            placeholder="Nombre"
            className="w-full rounded-xl border border-slate-200 px-3 py-2"
          />

          {/* Especie */}
          <select
            value={pet.especie}
            onChange={(e) => setPet({ ...pet, especie: e.target.value })}
            className="w-full rounded-xl border border-slate-200 px-3 py-2"
          >
            <option value="">Seleccionar especie</option>
            <option value="perro">Perro</option>
            <option value="gato">Gato</option>
            <option value="otro">Otro</option>
          </select>

          {/* Fecha */}
          <input
            type="date"
            value={pet.fechaNacimiento}
            onChange={(e) =>
              setPet({ ...pet, fechaNacimiento: e.target.value })
            }
            className="w-full rounded-xl border border-slate-200 px-3 py-2"
          />

          {/* Peso */}
          <input
            type="number"
            step="0.1"
            value={pet.peso}
            onChange={(e) => setPet({ ...pet, peso: e.target.value })}
            placeholder="Peso (kg)"
            className="w-full rounded-xl border border-slate-200 px-3 py-2"
          />

          {/* Microchip */}
          <input
            type="text"
            value={pet.microchip}
            onChange={(e) => setPet({ ...pet, microchip: e.target.value })}
            placeholder="Microchip (Si / No)"
            className="w-full rounded-xl border border-slate-200 px-3 py-2"
          />

          {error && (
            <p className="text-red-600 text-sm">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm border"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-sky-600 text-white font-semibold"
            >
              {saving ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
