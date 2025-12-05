// src/components/modals/ModalAgregarRegistro.jsx
import { useState, useEffect } from "react";
import { crearRegistroClinico, getProductos } from "../../services/api";
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
    vacuna_producto_id: "",
    // antiparasitarios
    anti_tipo: "",
    anti_marca: "",
    anti_detalles: "",
    anti_recordar: "",
    anti_producto_id: "",
    // productos de stock usados (inputs del formulario)
    tratamiento_producto: "",
    tratamiento_cantidad: 1,
    tratamiento_tipo: "tratamiento",
  });

  const [productos, setProductos] = useState([]);
  const [itemsTratamiento, setItemsTratamiento] = useState([]); // lista de productos agregados
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Cuando se abre el modal, refrescamos motivo y limpiamos errores
  useEffect(() => {
    if (!open) return;
    setForm((prev) => ({
      ...prev,
      motivo_consulta: motivoInicial || "",
    }));
    setError("");
  }, [open, motivoInicial]);

  // Cargar productos del backend solo cuando el modal esté abierto
  useEffect(() => {
    if (!open) return;

    const loadProductos = async () => {
      try {
        const resp = await getProductos();
        setProductos(resp.data || []);
      } catch (e) {
        console.error("Error cargando productos", e);
      }
    };

    loadProductos();
  }, [open]);

  // Limpiar la lista de productos cuando se cierra el modal
  useEffect(() => {
    if (!open) {
      setItemsTratamiento([]);
    }
  }, [open]);

  // Listas filtradas según categoría
  const productosVacuna = productos.filter((p) => p.categoria === "vacuna");
  const productosAntiparasitario = productos.filter(
    (p) => p.categoria === "antiparasitario"
  );
  const productosTratamiento = productos.filter(
    (p) =>
      p.categoria === "tratamiento" ||
      p.categoria === "insumo" ||
      p.categoria === "otro"
  );

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Si el usuario cambia el tipo de uso, vaciamos el producto principal
    if (name === "tratamiento_tipo") {
      setForm((prev) => ({
        ...prev,
        tratamiento_tipo: value,
        tratamiento_producto: "", // obligamos a elegir un producto compatible
      }));
      return;
    }

    // Si cambia el select de vacuna (desde inventario por lote)
    if (name === "vacuna_producto_id") {
      const prod = productosVacuna.find(
        (p) => String(p.id) === String(value)
      );

      if (!prod) {
        setForm((prev) => ({
          ...prev,
          vacuna_producto_id: "",
          vacuna_tipo: "",
          vacuna_marca: "",
        }));
        return;
      }

      setForm((prev) => ({
        ...prev,
        vacuna_producto_id: value,
        vacuna_tipo: prod.nombre,
        vacuna_marca: [
          prod.laboratorio || "",
          prod.lote ? `Lote ${prod.lote}` : "",
        ]
          .filter(Boolean)
          .join(" - "),
      }));
      return;
    }

    // Si cambia el select de antiparasitario (desde inventario por lote)
    if (name === "anti_producto_id") {
      const prod = productosAntiparasitario.find(
        (p) => String(p.id) === String(value)
      );

      if (!prod) {
        setForm((prev) => ({
          ...prev,
          anti_producto_id: "",
          anti_tipo: "",
          anti_marca: "",
        }));
        return;
      }

      setForm((prev) => ({
        ...prev,
        anti_producto_id: value,
        anti_tipo: prod.nombre,
        anti_marca: [
          prod.laboratorio || "",
          prod.lote ? `Lote ${prod.lote}` : "",
        ]
          .filter(Boolean)
          .join(" - "),
      }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddProducto = () => {
    if (!form.tratamiento_producto || Number(form.tratamiento_cantidad) <= 0) {
      return;
    }

    const productoObj = productos.find(
      (p) => String(p.id) === String(form.tratamiento_producto)
    );
    if (!productoObj) return;

    setItemsTratamiento((prev) => [
      ...prev,
      {
        producto: form.tratamiento_producto,
        producto_nombre: productoObj.nombre,
        producto_codigo: productoObj.codigo,
        cantidad: Number(form.tratamiento_cantidad),
        tipo: form.tratamiento_tipo || "tratamiento",
      },
    ]);

    // limpiar inputs de producto
    setForm((prev) => ({
      ...prev,
      tratamiento_producto: "",
      tratamiento_cantidad: 1,
      // mantenemos tratamiento_tipo
    }));
  };

  const handleRemoveItem = (index) => {
    setItemsTratamiento((prev) => prev.filter((_, i) => i !== index));
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

    const medicamentosFinal = [form.medicamentos, vacunaTexto, antiTexto]
      .filter(Boolean)
      .join("\n");

    // ---- Armamos items_tratamiento para el backend (stock) ----
    const items_tratamiento = itemsTratamiento.map((item) => ({
      producto: item.producto,
      cantidad: item.cantidad,
      tipo: item.tipo,
    }));

    // Agregar automáticamente 1 dosis de la vacuna seleccionada (si hay)
    if (form.vacuna_producto_id) {
      const yaExiste = items_tratamiento.find(
        (it) =>
          String(it.producto) === String(form.vacuna_producto_id) &&
          it.tipo === "vacuna"
      );
      if (!yaExiste) {
        items_tratamiento.push({
          producto: form.vacuna_producto_id,
          cantidad: 1,
          tipo: "vacuna",
        });
      }
    }

    // Agregar automáticamente 1 dosis del antiparasitario seleccionado (si hay)
    if (form.anti_producto_id) {
      const yaExiste = items_tratamiento.find(
        (it) =>
          String(it.producto) === String(form.anti_producto_id) &&
          it.tipo === "antiparasitario"
      );
      if (!yaExiste) {
        items_tratamiento.push({
          producto: form.anti_producto_id,
          cantidad: 1,
          tipo: "antiparasitario",
        });
      }
    }

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
        items_tratamiento, // importante para descontar stock
      });

      if (onSuccess) {
        await onSuccess();
      }
      setItemsTratamiento([]);
      setLoading(false);
      onClose();
    } catch (err) {
      console.error(err);

      const backendErrors =
        err?.response?.data?.items_tratamiento ||
        err?.response?.data?.detail ||
        null;

      if (Array.isArray(backendErrors)) {
        setError(backendErrors.join(" | "));
      } else if (typeof backendErrors === "string") {
        setError(backendErrors);
      } else {
        setError(
          "No se pudo guardar el registro clínico. Intenta nuevamente."
        );
      }

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

  // Según el tipo de uso, qué lista se usa en el select principal
  let productosParaSelect = [];
  if (form.tratamiento_tipo === "vacuna") {
    productosParaSelect = productosVacuna;
  } else if (form.tratamiento_tipo === "antiparasitario") {
    productosParaSelect = productosAntiparasitario;
  } else if (form.tratamiento_tipo === "tratamiento") {
    productosParaSelect = productosTratamiento;
  } else {
    productosParaSelect = productos;
  }

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

              {/* Producto de stock usado */}
              <div className="grid md:grid-cols-4 gap-4 items-end">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Producto utilizado (stock clínica)
                  </label>
                  <select
                    name="tratamiento_producto"
                    value={form.tratamiento_producto}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">Selecciona un producto</option>
                    {productosParaSelect.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} ({p.codigo}) — stock: {p.stock}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-[11px] text-slate-400">
                    El listado cambia según el tipo de uso seleccionado
                    (tratamiento, vacuna, antiparasitario).
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Cantidad usada
                  </label>
                  <input
                    type="number"
                    name="tratamiento_cantidad"
                    value={form.tratamiento_cantidad}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    min={1}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Tipo de uso
                  </label>
                  <select
                    name="tratamiento_tipo"
                    value={form.tratamiento_tipo}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="tratamiento">Tratamiento</option>
                    <option value="vacuna">Vacuna</option>
                    <option value="antiparasitario">Antiparasitario</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end mt-2">
                <button
                  type="button"
                  onClick={handleAddProducto}
                  className="px-3 py-1.5 text-xs rounded-lg border border-emerald-600 text-emerald-700 hover:bg-emerald-50"
                >
                  Agregar a la lista
                </button>
              </div>

              {itemsTratamiento.length > 0 && (
                <div className="mt-3 border border-dashed border-slate-200 rounded-xl p-3">
                  <p className="text-xs font-semibold text-slate-600 mb-2">
                    Productos agregados a este registro clínico
                  </p>
                  <div className="max-h-40 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-left text-slate-500">
                          <th className="py-1">Producto</th>
                          <th className="py-1">Tipo</th>
                          <th className="py-1 text-center">Cantidad</th>
                          <th className="py-1 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {itemsTratamiento.map((item, idx) => (
                          <tr key={idx} className="border-t border-slate-100">
                            <td className="py-1">
                              {item.producto_nombre} ({item.producto_codigo})
                            </td>
                            <td className="py-1 capitalize">{item.tipo}</td>
                            <td className="py-1 text-center">
                              {item.cantidad}
                            </td>
                            <td className="py-1 text-right">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(idx)}
                                className="text-xs text-red-600 hover:underline"
                              >
                                Quitar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

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

                  {productosVacuna.length > 0 ? (
                    <select
                      name="vacuna_producto_id"
                      value={form.vacuna_producto_id}
                      onChange={handleChange}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="">
                        Selecciona una vacuna del inventario
                      </option>
                      {productosVacuna.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nombre} {p.lote ? `(Lote ${p.lote})` : ""}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      name="vacuna_tipo"
                      value={form.vacuna_tipo}
                      onChange={handleChange}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                      placeholder="Ej: Antirrábica, Polivalente..."
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Marca y N° de serie / lote
                  </label>
                  <input
                    type="text"
                    name="vacuna_marca"
                    value={form.vacuna_marca}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    placeholder="Se autocompleta desde el inventario, pero puedes editarlo."
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

                  {productosAntiparasitario.length > 0 ? (
                    <select
                      name="anti_producto_id"
                      value={form.anti_producto_id}
                      onChange={handleChange}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="">
                        Selecciona un antiparasitario del inventario
                      </option>
                      {productosAntiparasitario.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nombre} {p.codigo ? `(${p.codigo})` : ""}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      name="anti_tipo"
                      value={form.anti_tipo}
                      onChange={handleChange}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                      placeholder="Comprimidos, pipeta, inyectable..."
                    />
                  )}
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
