// src/components/modals/ModalReceta.jsx
import React from "react";
import { X, Printer } from "lucide-react";

export default function ModalReceta({ open, onClose, registro, mascota }) {
  if (!open || !registro || !mascota) return null;

  // --------- Datos del paciente ---------
  const nombreMascota = mascota?.nombre || "Paciente";
  const especie = mascota?.especie || "";
  const raza = mascota?.raza || "";
  const sexo = mascota?.sexo || "";
  const descripcionPaciente = [
    especie && especie.toLowerCase(),
    raza,
    sexo && sexo.charAt(0).toUpperCase() + sexo.slice(1).toLowerCase(),
  ]
    .filter(Boolean)
    .join(" · ");

  // --------- DATOS DEL TUTOR (AQUÍ ESTABA EL PROBLEMA) ---------
  // Buscamos el nombre del tutor en varios campos posibles,
  // tanto en la mascota como en la cita asociada al registro.
  const tutorNombre =
    mascota?.dueno_nombre ||
    mascota?.cliente_nombre ||
    mascota?.propietario_nombre ||
    mascota?.owner_name ||
    mascota?.cliente?.nombre_completo ||
    [mascota?.cliente?.first_name, mascota?.cliente?.last_name]
      .filter(Boolean)
      .join(" ") ||
    registro?.cita?.cliente_nombre ||
    registro?.cita?.cliente?.nombre_completo ||
    [registro?.cita?.cliente?.first_name, registro?.cita?.cliente?.last_name]
      .filter(Boolean)
      .join(" ") ||
    "Sin datos";

  const tutorTelefono =
    mascota?.dueno_telefono ||
    mascota?.cliente_telefono ||
    mascota?.propietario_telefono ||
    mascota?.owner_phone ||
    mascota?.cliente?.telefono ||
    mascota?.cliente?.phone ||
    registro?.cita?.cliente_telefono ||
    registro?.cita?.cliente?.telefono ||
    registro?.cita?.cliente?.phone ||
    "-";

    const tutorRut =
    mascota?.dueno_rut ||
    mascota?.cliente_rut ||
    mascota?.cliente?.rut_dni ||
    "-";
  // --------- DATOS DEL PROFESIONAL (vendrán de AuthContext más adelante) ---------
  const profesionalNombre =
    registro?.veterinario_nombre || "Nombre del profesional";

  const fechaReceta = registro?.fecha || registro?.created_at || new Date().toISOString();
  const fechaFormateada = new Date(fechaReceta).toLocaleString("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const motivo = registro?.motivo_consulta || "";
  const diagnostico = registro?.diagnostico || "";
  const medicamentos = registro?.medicamentos || "";
  const indicaciones = registro?.notas || "";

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4 py-6">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[95vh] overflow-y-auto print:max-h-none print:shadow-none print:rounded-none">
        {/* CABECERA */}
        <div className="flex items-center justify-between border-b px-6 py-4 print:border-none">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Receta veterinaria
            </h2>
            <p className="text-xs text-slate-500">
              Documento para impresión y entrega al tutor del paciente.
            </p>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5"
            >
              <Printer className="h-4 w-4" />
              Imprimir
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* CUERPO */}
        <div className="px-6 py-5 space-y-6 text-sm text-slate-800">
          {/* Encabezado clínico simple */}
          <div className="border-b pb-4">
            <h3 className="font-semibold text-slate-900">
              Clínica Veterinaria
            </h3>
          </div>

          {/* Paciente / Tutor / Fecha / Profesional */}
          <div className="grid md:grid-cols-2 gap-4 border-b pb-4">
            <div>
              <p className="text-[11px] font-semibold text-slate-500">
                PACIENTE
              </p>
              <p className="text-sm font-semibold text-slate-900">
                {nombreMascota}
              </p>
              <p className="text-xs text-slate-600">{descripcionPaciente}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500">
                TUTOR
              </p>
              <p className="text-sm font-semibold text-slate-900">
                {tutorNombre}
              </p>
              <p className="text-xs text-slate-600">Tel: {tutorTelefono}</p>
              <p className="text-sm text-slate-600">
                RUT: {tutorRut || "-"}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500">
                FECHA
              </p>
              <p className="text-sm text-slate-900">{fechaFormateada}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500">
                PROFESIONAL
              </p>
              <p className="text-sm font-semibold text-slate-900">
                {profesionalNombre}
              </p>
            </div>
          </div>

          {/* Motivo y diagnóstico */}
          <div className="space-y-3 border-b pb-4">
            {motivo && (
              <div>
                <p className="text-[11px] font-semibold text-slate-500">
                  MOTIVO CONSULTA
                </p>
                <p className="text-sm text-slate-800 whitespace-pre-line">
                  {motivo}
                </p>
              </div>
            )}

            {diagnostico && (
              <div>
                <p className="text-[11px] font-semibold text-slate-500">
                  DIAGNÓSTICO
                </p>
                <p className="text-sm text-slate-800 whitespace-pre-line">
                  {diagnostico}
                </p>
              </div>
            )}
          </div>

          {/* Medicamentos */}
          {medicamentos && (
            <div className="space-y-2 border-b pb-4">
              <p className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                <span className="text-emerald-600">➊</span> Medicamentos y
                posología
              </p>
              <div className="bg-slate-50 rounded-2xl border border-slate-200 px-3 py-2 text-xs whitespace-pre-line">
                {medicamentos}
              </div>
            </div>
          )}

          {/* Notas / indicaciones */}
          {indicaciones && (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-slate-500">
                INDICACIONES ADICIONALES
              </p>
              <p className="text-sm text-slate-800 whitespace-pre-line">
                {indicaciones}
              </p>
            </div>
          )}

          {/* Firma */}
          <div className="pt-8 pb-6">
            <div className="w-52 border-t border-slate-300" />
            <p className="text-xs text-slate-600 mt-1">
              Firma y timbre del profesional
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
