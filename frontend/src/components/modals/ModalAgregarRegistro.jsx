// src/components/modals/ModalAgregarRegistro.jsx
import { useState, useEffect } from "react";
import { crearRegistroClinico } from "../../services/api";
import {
  X,
  Calendar,
  Stethoscope,
  ClipboardList,
  Pill,
  Syringe,
} from "lucide-react";

export default function ModalAgregarRegistro({
  open,
  onClose,
  mascotaId,
  citaId,
  motivoInicial = "",
  nombreMascota = "",
  onSuccess,
}) {
  // ------- STATE -------
  const [form, setForm] = useState({
    // consulta
    tipo_consulta: "",
    motivo_consulta: motivoInicial,
    anamnesis: "",
    // examen / diagnóstico
    examen_fisico: "",
    diagnostico: "",
    // tratamiento general
    procedimientos: "",
    tratamientos: "",
    medicamentos: "",
    evolucion: "",
    notas: "",
    // vacunas
    vacuna_tipo: "",
    vacuna_marca: "",
    vacuna_detalles: "",
    vacuna_recordar: "",
    // antiparasitarios
    anti_tipo: "",
    anti_marca: "",
    anti_detalles: "",
    anti_recordar: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      motivo_consulta: motivoInicial,
    }));
  }, [motivoInicial]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // ---- Armamos textos finales a partir de la UI "elegante" ----

    const motivoFinal = [
      form.tipo_consulta && `Tipo de consulta: ${form.tipo_consulta}`,
      form.motivo_consulta && `Motivo: ${form.motivo_consulta}`,
      form.anamnesis && `Anamnesis: ${form.anamnesis}`,
    ]
      .filter(Boolean)
      .join(" | ");

    const diagnosticoFinal = [
      form.examen_fisico && `Examen físico: ${form.examen_fisico}`,
      form.diagnostico && `Diagnóstico: ${form.diagnostico}`,
    ]
      .filter(Boolean)
      .join(" | ");

    const vacunaTexto = [
      form.vacuna_tipo && `Vacuna: ${form.vacuna_tipo}`,
      form.vacuna_marca && `Marca / N° serie: ${form.vacuna_marca}`,
      form.vacuna_detalles && `Detalles: ${form.vacuna_detalles}`,
      form.vacuna_recordar &&
        `Recordar en: ${form.vacuna_recordar} día(s) para próximo refuerzo`,
    ]
      .filter(Boolean)
      .join(" | ");

    const antiTexto = [
      form.anti_tipo && `Antiparasitario: ${form.anti_tipo}`,
      form.anti_marca && `Marca / N° serie: ${form.anti_marca}`,
      form.anti_detalles && `Detalles: ${form.anti_detalles}`,
      form.anti_recordar &&
        `Recordar en: ${form.anti_recordar} día(s) para próxima dosis`,
    ]
      .filter(Boolean)
      .join(" | ");

    const medicamentosFinal = [
      form.medicamentos,
      vacunaTexto,
      antiTexto,
    ]
      .filter(Boolean)
      .join("\n");

    try {
      await crearRegistroClinico({
        mascota: mascotaId,
        cita: citaId ?? null,
        motivo_consulta: motivoFinal,
        diagnostico: diagnosticoFinal,
        procedimientos: form.procedimientos,
        tratamientos: form.tratamientos,
        medicamentos: medicamentosFinal,
        evolucion: form.evolucion,
        notas: form.notas,
      });

      if (onSuccess) {
        await onSuccess();
      }

      setLoading(false);
      onClose();
    } catch (err) {
      console.error(err);
      setError("No se pudo guardar el registro clínico. Intenta nuevamente.");
      setLoading(false);
    }
  };

  if (!open) return null;

  const hoy = new Date().toLocaleString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 overflow-y-auto">
      <div className="fixed inset-0 flex items-start justify-center overflow-y-auto">
        <div className="mt-6 mb-6 w-full max-w-5xl rounded-3xl bg-white shadow-2xl border border-slate-200">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 rounded-t-3xl">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                Nueva visita / registro clínico
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Completa la información de la atención para la historia clínica.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-full hover:bg-slate-200 text-slate-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-6">
            {error && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            {/* Datos generales */}
            <section className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 uppercase tracking-[0.15em] mb-1">
                  <Calendar className="h-4 w-4 text-emerald-600" />
                  Fecha y hora
                </label>
                <input
                  type="text"
                  value={hoy}
                  readOnly
                  className="w-full border rounded-lg px-3 py-2 bg-slate-50 text-slate-700 text-sm"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 uppercase tracking-[0.15em] mb-1">
                  Paciente
                </label>
                <input
                  type="text"
                  value={nombreMascota || `ID mascota: ${mascotaId}`}
                  readOnly
                  className="w-full border rounded-lg px-3 py-2 bg-slate-50 text-slate-700 text-sm"
                />
              </div>
            </section>

            {/* Motivo / Anamnesis */}
            <section className="border border-slate-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-emerald-600" />
                <h3 className="text-sm font-semibold text-slate-900">
                  Motivo de la visita y anamnesis
                </h3>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Tipo de consulta
                  </label>
                  <select
                    name="tipo_consulta"
                    value={form.tipo_consulta}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">Selecciona una opción</option>
                    <option value="Preventiva">Preventiva</option>
                    <option value="Enfermedad aguda">Enfermedad aguda</option>
                    <option value="Control crónico">Control crónico</option>
                    <option value="Vacunación">Vacunación</option>
                    <option value="Urgencia">Urgencia</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Motivo de la visita
                  </label>
                  <textarea
                    name="motivo_consulta"
                    value={form.motivo_consulta}
                    onChange={handleChange}
                    rows={2}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    placeholder="Motivo principal por el que el paciente acude a la consulta"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Anamnesis
                </label>
                <textarea
                  name="anamnesis"
                  value={form.anamnesis}
                  onChange={handleChange}
                  rows={3}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="Historia clínica relatada por el tutor: inicio de síntomas, cambios de conducta, alimentación, etc."
                />
              </div>
            </section>

            {/* Examen físico y diagnóstico */}
            <section className="border border-slate-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-emerald-600" />
                <h3 className="text-sm font-semibold text-slate-900">
                  Examen físico y diagnóstico
                </h3>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Examen físico
                  </label>
                  <textarea
                    name="examen_fisico"
                    value={form.examen_fisico}
                    onChange={handleChange}
                    rows={4}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    placeholder="Hallazgos del examen físico: T°, FC, FR, mucosas, palpación, etc."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Diagnóstico
                  </label>
                  <textarea
                    name="diagnostico"
                    value={form.diagnostico}
                    onChange={handleChange}
                    rows={4}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    placeholder="Diagnóstico presuntivo o definitivo."
                  />
                </div>
              </div>
            </section>

            {/* Tratamiento / Medicamentos / Evolución */}
            <section className="border border-slate-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Pill className="h-4 w-4 text-emerald-600" />
                <h3 className="text-sm font-semibold text-slate-900">
                  Tratamiento y medicamentos
                </h3>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Procedimientos realizados
                  </label>
                  <textarea
                    name="procedimientos"
                    value={form.procedimientos}
                    onChange={handleChange}
                    rows={3}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Tratamientos indicados
                  </label>
                  <textarea
                    name="tratamientos"
                    value={form.tratamientos}
                    onChange={handleChange}
                    rows={3}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    placeholder="Procedimientos o indicaciones terapéuticas realizadas."
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Medicamentos (texto libre)
                </label>
                <textarea
                  name="medicamentos"
                  value={form.medicamentos}
                  onChange={handleChange}
                  rows={2}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="Si quieres, puedes escribir aquí un resumen general de medicamentos."
                />
              </div>
            </section>

            {/* Vacunas */}
            <section className="border border-slate-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Syringe className="h-4 w-4 text-emerald-600" />
                <h3 className="text-sm font-semibold text-slate-900">
                  Vacunas
                </h3>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Tipo de vacuna
                  </label>
                  <input
                    type="text"
                    name="vacuna_tipo"
                    value={form.vacuna_tipo}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    placeholder="Ej: Antirrábica, Polivalente..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Marca y N° de serie
                  </label>
                  <input
                    type="text"
                    name="vacuna_marca"
                    value={form.vacuna_marca}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Detalles adicionales
                  </label>
                  <textarea
                    name="vacuna_detalles"
                    value={form.vacuna_detalles}
                    onChange={handleChange}
                    rows={2}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    placeholder="Reacciones, observaciones de la vacunación, etc."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Recordatorio (en días)
                  </label>
                  <input
                    type="number"
                    min="0"
                    name="vacuna_recordar"
                    value={form.vacuna_recordar}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    placeholder="Ej: 365"
                  />
                </div>
              </div>
            </section>

            {/* Antiparasitarios */}
            <section className="border border-slate-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Pill className="h-4 w-4 text-purple-600" />
                <h3 className="text-sm font-semibold text-slate-900">
                  Antiparasitarios
                </h3>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Tipo de antiparasitario
                  </label>
                  <input
                    type="text"
                    name="anti_tipo"
                    value={form.anti_tipo}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    placeholder="Comprimidos, pipeta, inyectable..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Marca y N° de serie
                  </label>
                  <input
                    type="text"
                    name="anti_marca"
                    value={form.anti_marca}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Detalles adicionales
                  </label>
                  <textarea
                    name="anti_detalles"
                    value={form.anti_detalles}
                    onChange={handleChange}
                    rows={2}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    placeholder="Peso usado para calcular dosis, fecha próxima dosis, etc."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Recordatorio (en días)
                  </label>
                  <input
                    type="number"
                    min="0"
                    name="anti_recordar"
                    value={form.anti_recordar}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    placeholder="Ej: 90"
                  />
                </div>
              </div>
            </section>

            {/* Notas finales */}
            <section className="border border-slate-200 rounded-2xl p-4 space-y-2">
              <h3 className="text-sm font-semibold text-slate-900">
                Notas adicionales
              </h3>
              <textarea
                name="notas"
                value={form.notas}
                onChange={handleChange}
                rows={2}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                placeholder="Cualquier información extra relevante para futuros controles."
              />
            </section>

            {/* Footer */}
            <div className="flex justify-between items-center pt-2 pb-4">
              <p className="text-xs text-slate-500">
                La receta y otros documentos se pueden generar después a partir
                de este registro clínico.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="px-4 py-2 text-sm rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {loading ? "Guardando..." : "Guardar registro"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
