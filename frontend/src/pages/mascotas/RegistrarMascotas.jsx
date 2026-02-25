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
import api from "../../services/api";

// ---------------------------------------------------------
// OBTENER user_id DEL TOKEN JWT PARA cliente_id
// ---------------------------------------------------------
const getUserIdFromToken = () => {
  try {
    const token = localStorage.getItem("access");
    if (!token) return null;

    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.user_id || payload.user || null;
  } catch {
    return null;
  }
};

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
  const [showDateAlert, setShowDateAlert] = useState(false);

  // NUEVO: popup de éxito
  const [showSuccess, setShowSuccess] = useState(false);

  // NUEVO: popup validaciones generales
  const [showValidationAlert, setShowValidationAlert] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");

  // ---------------------------------------------------------
  // VALIDAR FECHA FUTURA
  // ---------------------------------------------------------
  const isFutureDate = (dateStr) => {
    if (!dateStr) return false;
    const today = new Date();
    const selected = new Date(dateStr);
    return selected > today;
  };

  // ---------------------------------------------------------
  // CALCULAR EDAD (AÑOS)
  // ---------------------------------------------------------
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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setPet((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (name === "fechaNacimiento" && value) {
      if (isFutureDate(value)) {
        setShowDateAlert(true);
      }
    }
  };

  // ---------------------------------------------------------
  // NORMALIZAR ESPECIE
  // ---------------------------------------------------------
  const normalizeSpecies = (value) =>
    value ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase() : "";

  // ---------------------------------------------------------
  // MICROCHIP → FORMATO CORRECTO
  // ---------------------------------------------------------
  const normalizeMicrochip = (value) => {
    if (!value || value.trim() === "") return null;
    const v = value.trim().toLowerCase();

    if (v === "si" || v === "sí") return "Si";
    if (v === "no") return "No";

    return "__INVALID__";
  };

  // ---------------------------------------------------------
  // VALIDACIONES FRONT REALISTAS
  // ---------------------------------------------------------
  const validarFormulario = () => {
    // Nombre obligatorio
    if (!pet.nombre || !pet.nombre.trim()) {
      return "El nombre de la mascota es obligatorio.";
    }

    // Especie obligatoria
    if (!pet.especie) {
      return "Debes seleccionar una especie válida.";
    }

    // Raza (si viene) largo razonable
    if (pet.raza && pet.raza.trim().length > 100) {
      return "La raza no puede superar los 100 caracteres.";
    }

    // Fecha nacimiento: no futura + edad máxima 100
    if (pet.fechaNacimiento) {
      if (isFutureDate(pet.fechaNacimiento)) {
        return "La fecha de nacimiento no puede ser en el futuro.";
      }

      const edad = calcularEdad(pet.fechaNacimiento);
      if (edad !== null && edad > 100) {
        return "La edad de la mascota no es válida (máximo 100 años).";
      }
    }

    // Peso: > 0 y <= 250
    if (pet.peso !== "" && pet.peso !== null && pet.peso !== undefined) {
      const peso = Number(pet.peso);
      if (Number.isNaN(peso)) return "El peso ingresado no es válido.";
      if (peso <= 0) return "El peso debe ser mayor a cero.";
      if (peso > 250) return "El peso no puede superar los 250 kg.";
    }

    // Microchip: Si/No/vacío
    const chip = normalizeMicrochip(pet.microchip);
    if (chip === "__INVALID__") {
      return "El microchip solo puede ser 'Si' o 'No' (o dejarse vacío).";
    }

    // Notas: largo razonable
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

    // Validaciones front
    const errorValidacion = validarFormulario();
    if (errorValidacion) {
      setSaving(false);
      setValidationMessage(errorValidacion);
      setShowValidationAlert(true);
      return;
    }

    // Mantengo tu popup específico por fecha futura (por si quedó abierto)
    if (isFutureDate(pet.fechaNacimiento)) {
      setSaving(false);
      setShowDateAlert(true);
      return;
    }

    const clienteId = getUserIdFromToken();
    if (!clienteId) {
      setSaving(false);
      setError("No se encontró un cliente válido.");
      return;
    }

    try {
      const chip = normalizeMicrochip(pet.microchip);

      const payload = {
        cliente_id: clienteId,
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

      await api.post("/mascotas/", payload);

      // ÉXITO → mostrar popup premium
      setShowSuccess(true);

      setTimeout(() => {
        navigate("/cliente/mis-mascotas");
      }, 1500);

      setSaving(false);
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
              Vetyon · Cliente
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
                  className="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 shadow-sm focus:ring-2 focus:ring-sky-300"
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
                  className="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 shadow-sm focus:ring-2 focus:ring-sky-300"
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
                  className="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 shadow-sm focus:ring-2 focus:ring-sky-300"
                />
              </div>
            </div>

            {/* Sexo / fecha nacimiento */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600">Sexo</label>
                <select
                  name="sexo"
                  value={pet.sexo}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 shadow-sm focus:ring-2 focus:ring-sky-300"
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
                  className="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 shadow-sm focus:ring-2 focus:ring-sky-300"
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
                  className="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 shadow-sm focus:ring-2 focus:ring-sky-300"
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
                placeholder="Si / No"
                className="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 shadow-sm focus:ring-2 focus:ring-sky-300"
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
                placeholder="Alergias, medicamentos, enfermedades crónicas..."
                className="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 shadow-sm focus:ring-2 focus:ring-sky-300 resize-none"
              />
            </div>

            {error && <p className="text-red-600 text-sm mt-2">{error}</p>}

            {/* Footer */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pt-2">
              <p className="text-[11px] text-slate-400 max-w-md">
                *La información será utilizada para facilitar tus próximas
                reservas.
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

      {/* POPUP VALIDACIONES GENERALES */}
      {showValidationAlert && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-xl shadow-xl border border-neutral-200 p-6 w-full max-w-xs text-center animate-fadeScale">
            <h2 className="text-lg font-semibold text-neutral-800 mb-2">
              Revisa el formulario
            </h2>
            <p className="text-neutral-600 text-sm mb-6">{validationMessage}</p>
            <button
              onClick={() => setShowValidationAlert(false)}
              className="w-full py-2 rounded-lg bg-sky-600 text-white font-semibold hover:bg-sky-700 transition"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* POPUP FECHA FUTURA */}
      {showDateAlert && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-xl shadow-xl border border-neutral-200 p-6 w-full max-w-xs text-center animate-fadeScale">
            <h2 className="text-lg font-semibold text-neutral-800 mb-2">
              Fecha inválida
            </h2>
            <p className="text-neutral-600 text-sm mb-6">
              La fecha de nacimiento no puede ser en el futuro.
            </p>
            <button
              onClick={() => setShowDateAlert(false)}
              className="w-full py-2 rounded-lg bg-sky-600 text-white font-semibold hover:bg-sky-700 transition"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* POPUP DE ÉXITO (VETYON STYLE) */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999] p-4">

          <div className="bg-white rounded-xl shadow-xl border border-neutral-200 p-6 w-full max-w-xs text-center animate-fadeScale">
            <h2 className="text-lg font-semibold text-slate-800 mb-2">
              Mascota registrada
            </h2>
            <p className="text-slate-600 text-sm mb-6">
              Tu mascota ha sido registrada exitosamente.
            </p>

            <button
              onClick={() => navigate("/cliente/mis-mascotas")}
              className="w-full py-2 rounded-lg bg-sky-600 text-white font-semibold hover:bg-sky-700 transition"
            >
              Continuar
            </button>
          </div>
        </div>
      )}
    </LayoutCliente>
  );
}
