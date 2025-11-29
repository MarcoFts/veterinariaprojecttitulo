// src/pages/cliente/citas.jsx
import LayoutCliente from "../../components/layout/LayoutCliente";
import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import "dayjs/locale/es";
import {
  CalendarDays,
  Clock,
  Stethoscope,
  Info,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  getVeterinarios,
  getMascotas,
  getCitas,
  crearCita,
  getDisponibilidad,
  reprogramarCita,
  cancelarCita,
  getMotivosConsulta,
} from "../../services/api";

dayjs.locale("es");

const LABEL_OTRO_MOTIVO = "Otro motivo";

export default function Citas() {
  const hoy = dayjs().format("YYYY-MM-DD");

  const [fecha, setFecha] = useState(hoy);
  const [weekOffset, setWeekOffset] = useState(0); // desplazamiento de semanas (en días)

  const [motivosPredef, setMotivosPredef] = useState([]);

  const [veterinarios, setVeterinarios] = useState([]);
  const [mascotas, setMascotas] = useState([]);
  const [citasDia, setCitasDia] = useState([]);

  const [loading, setLoading] = useState(false);
  const [loadingForm, setLoadingForm] = useState(false);
  const [error, setError] = useState("");

  // slots para crear cita
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // form.hora SIEMPRE viene de un slot del backend
  const [form, setForm] = useState({
    mascota: "",
    veterinario: "",
    fecha: hoy,
    hora: "",
    duracion: 30, // uso interno
    motivo: "", // valor seleccionado del select
    motivoOtro: "", // texto libre si selecciona "Otro motivo"
    box: "",
  });

  // --- Estado para reprogramar ---
  const [showModal, setShowModal] = useState(false);
  const [selectedCita, setSelectedCita] = useState(null);
  const [nuevaFecha, setNuevaFecha] = useState(hoy);
  const [slotsReprog, setSlotsReprog] = useState([]);
  const [loadingSlotsReprog, setLoadingSlotsReprog] = useState(false);
  const [slotSeleccionado, setSlotSeleccionado] = useState("");
  const [savingReprog, setSavingReprog] = useState(false);

  // ---------- Helpers ----------

  const citasOrdenadas = useMemo(() => {
    return [...citasDia].sort((a, b) =>
      dayjs(a.inicio).isAfter(dayjs(b.inicio)) ? 1 : -1
    );
  }, [citasDia]);

  // Próximos 7 días para el “calendario” de la izquierda según weekOffset
  const upcomingDays = useMemo(() => {
    const base = dayjs().add(weekOffset, "day");
    return Array.from({ length: 7 }, (_, i) => {
      const d = base.add(i, "day");
      return {
        value: d.format("YYYY-MM-DD"),
        dia: d.format("DD"),
        dow: d.format("ddd"), // lu, ma, mi...
      };
    });
  }, [weekOffset]);

  const currentMonthLabel = useMemo(() => {
    return dayjs().add(weekOffset, "day").format("MMM YYYY");
  }, [weekOffset]);

  const handleChangeForm = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ---------- Cargar datos base (vets, mascotas, citas) ----------
  const cargarDatos = async () => {
    setLoading(true);
    setError("");
    try {
      const [vetsResp, petsResp, citasResp] = await Promise.all([
        getVeterinarios(),
        getMascotas(),
        getCitas({ fecha }),
      ]);

      setVeterinarios(vetsResp.data || []);
      setMascotas(petsResp.data || []);
      setCitasDia(citasResp.data || []);
    } catch (err) {
      if (err?.response?.status === 401) {
        setError(
          "Tu sesión expiró. Vuelve a iniciar sesión cuando el backend esté activo."
        );
      } else {
        setError("No se pudieron cargar los datos desde el servidor.");
      }
    } finally {
      setLoading(false);
    }
  };

  // cargar motivos predefinidos desde el backend
  const cargarMotivos = async () => {
    try {
      const resp = await getMotivosConsulta();
      let base = resp.data || [];

      // Nos aseguramos de que exista "Otro motivo"
      const tieneOtro = base.some(
        (m) => (m.nombre || "").toLowerCase() === LABEL_OTRO_MOTIVO.toLowerCase()
      );
      if (!tieneOtro) {
        base = [
          ...base,
          { codigo: "OTRO", nombre: LABEL_OTRO_MOTIVO },
        ];
      }

      setMotivosPredef(base);
    } catch (err) {
      console.error("Error cargando motivos de consulta:", err);
      // si falla, simplemente dejamos el arreglo vacío
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [fecha]);

  useEffect(() => {
    cargarMotivos();
  }, []);

  // ---------- Disponibilidad para crear cita ----------

  const cargarSlotsCrear = async (values) => {
    const f = values || form;
    if (!f.veterinario || !f.fecha) return;

    setLoadingSlots(true);
    setSlots([]);
    try {
      const resp = await getDisponibilidad({
        veterinario_id: f.veterinario,
        fecha: f.fecha,
        duracion: f.duracion || 30,
        box: f.box || "",
      });
      setSlots(resp.data?.slots || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSlots(false);
    }
  };

  // cambio en el select de veterinario
  const handleChangeVetOrFecha = async (e) => {
    const { name, value } = e.target;
    const nuevoForm = {
      ...form,
      [name]: value,
      hora: "",
    };
    setForm(nuevoForm);

    if (nuevoForm.veterinario && nuevoForm.fecha) {
      await cargarSlotsCrear(nuevoForm);
    }
  };

  // selección desde el calendario de chips de días
  const handleSelectDia = async (dateValue) => {
    const nuevoForm = {
      ...form,
      fecha: dateValue,
      hora: "",
    };
    setForm(nuevoForm);
    setFecha(dateValue); // sincroniza la agenda del día de la derecha
    if (nuevoForm.veterinario) {
      await cargarSlotsCrear(nuevoForm);
    }
  };

  // navegar semanas con flechas
  const handleWeekNav = async (direction) => {
    let nextOffset = direction === "next" ? weekOffset + 7 : weekOffset - 7;

    // no permitimos ir a antes de hoy
    if (nextOffset < 0) {
      nextOffset = 0;
    }

    const base = dayjs().add(nextOffset, "day");
    const newDate = base.format("YYYY-MM-DD");

    const nuevoForm = {
      ...form,
      fecha: newDate,
      hora: "",
    };

    setWeekOffset(nextOffset);
    setForm(nuevoForm);
    setFecha(newDate);

    if (nuevoForm.veterinario) {
      await cargarSlotsCrear(nuevoForm);
    }
  };

  // cambio de fecha desde el input superior derecho (panel citas del día)
  const handleChangeFechaHeader = async (e) => {
    const val = e.target.value;
    setFecha(val);

    const nuevoForm = {
      ...form,
      fecha: val,
      hora: "",
    };
    setForm(nuevoForm);

    // ajustamos weekOffset para que el calendario se mueva cerca de esa fecha
    const diffDays = dayjs(val).diff(dayjs().startOf("day"), "day");
    const alignedOffset = diffDays < 0 ? 0 : diffDays - (diffDays % 7);
    setWeekOffset(alignedOffset);

    if (nuevoForm.veterinario) {
      await cargarSlotsCrear(nuevoForm);
    }
  };

  // ---------- Crear cita ----------

  const handleSubmitCrear = async (e) => {
    e.preventDefault();
    if (!form.mascota || !form.veterinario || !form.fecha || !form.hora) {
      alert(
        "Debes seleccionar mascota, veterinario, fecha y un horario disponible."
      );
      return;
    }

    // Si seleccionó "Otro motivo", exigimos que escriba el texto
    if (
      form.motivo === LABEL_OTRO_MOTIVO &&
      !form.motivoOtro.trim()
    ) {
      alert("Por favor escribe el motivo de la consulta.");
      return;
    }

    const inicio = `${form.fecha}T${form.hora}`;
    const durMin = Number(form.duracion || 30);
    const fin = dayjs(inicio)
      .add(durMin, "minute")
      .format("YYYY-MM-DDTHH:mm");

    // motivo final: si es "Otro motivo", usamos el texto libre
    const motivoFinal =
      form.motivo === LABEL_OTRO_MOTIVO
        ? form.motivoOtro.trim()
        : form.motivo || "";

    const payload = {
      mascota: form.mascota,
      veterinario: form.veterinario,
      inicio,
      fin,
      motivo: motivoFinal,
      box: form.box || "",
    };

    setLoadingForm(true);
    try {
      await crearCita(payload);
      setForm((prev) => ({
        ...prev,
        hora: "",
        motivo: "",
        motivoOtro: "",
      }));
      setSlots([]);
      await cargarDatos();
    } catch (err) {
      console.error(err);
      alert("No se pudo crear la cita. Revisa los datos o la disponibilidad.");
    } finally {
      setLoadingForm(false);
    }
  };

  // ---------- Cancelar cita ----------

  const handleCancelarCita = async (citaId) => {
    if (!window.confirm("¿Seguro que deseas cancelar esta cita?")) return;
    try {
      await cancelarCita(citaId);
      await cargarDatos();
    } catch (err) {
      console.error(err);
      alert("No se pudo cancelar la cita.");
    }
  };

  // ---------- Reprogramar (cliente) ----------

  const calcularDuracionCita = (cita) => {
    if (cita.inicio && cita.fin) {
      const diff = dayjs(cita.fin).diff(dayjs(cita.inicio), "minute");
      return diff > 0 ? diff : 30;
    }
    return 30;
  };

  const cargarSlotsReprogramar = async (cita, fechaReprog) => {
    if (!cita) return;
    setLoadingSlotsReprog(true);
    setSlotsReprog([]);
    try {
      const dur = calcularDuracionCita(cita);

      // Aseguramos el id del vet
      const vetId = cita.veterinario_id || cita.veterinario;

      const resp = await getDisponibilidad({
        veterinario_id: vetId,
        fecha: fechaReprog,
        duracion: dur,
        // IMPORTANTE: por ahora NO filtramos por box,
        // porque los horarios del vet no tienen box definido.
        box: "",
      });

      setSlotsReprog(resp.data?.slots || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSlotsReprog(false);
    }
  };

  const abrirModalReprogramar = async (cita) => {
    setSelectedCita(cita);
    const fechaActual = cita.inicio?.slice(0, 10) || fecha;
    setNuevaFecha(fechaActual);
    setSlotSeleccionado("");
    setSlotsReprog([]);
    setShowModal(true);
    await cargarSlotsReprogramar(cita, fechaActual);
  };

  const handleFechaReprogChange = async (e) => {
    const nueva = e.target.value;
    setNuevaFecha(nueva);
    setSlotSeleccionado("");
    await cargarSlotsReprogramar(selectedCita, nueva);
  };

  const handleSubmitReprogramar = async (e) => {
    e.preventDefault();
    if (!selectedCita || !nuevaFecha || !slotSeleccionado) return;

    const inicio = `${nuevaFecha}T${slotSeleccionado}`;

    setSavingReprog(true);
    try {
      await reprogramarCita(selectedCita.id, {
        inicio,
        duracion: calcularDuracionCita(selectedCita),
        box: selectedCita.box || "",
      });
      setShowModal(false);
      setSelectedCita(null);
      await cargarDatos();
    } catch (err) {
      console.error(err);
      alert("No se pudo reprogramar la cita. Revisa la disponibilidad.");
    } finally {
      setSavingReprog(false);
    }
  };

  // ---------- Render ----------

  return (
    <LayoutCliente>
      <div className="space-y-6">
        {/* Encabezado */}
        <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <p className="text-xs font-semibold tracking-[0.25em] text-sky-600 uppercase mb-1">
              VetCare · Cliente
            </p>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
              Agenda tus citas
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Elige mascota, veterinario y horario disponible. También puedes
              reprogramar o cancelar citas existentes.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-700">
              Fecha:
            </label>
            <input
              type="date"
              value={fecha}
              onChange={handleChangeFechaHeader}
              className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            />
            <button
              onClick={cargarDatos}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw className="h-4 w-4" />
              Actualizar
            </button>
          </div>
        </section>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Panel izquierdo: crear cita */}
          <section className="bg-white/90 rounded-2xl border border-slate-200 shadow-sm p-4 md:p-5 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Stethoscope className="h-5 w-5 text-sky-600" />
              <h2 className="text-sm font-semibold text-slate-900">
                Nueva cita
              </h2>
            </div>

            <form onSubmit={handleSubmitCrear} className="space-y-4 text-sm">
              {/* Mascota */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600">
                  Mascota
                </label>
                <select
                  name="mascota"
                  value={form.mascota}
                  onChange={handleChangeForm}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
                >
                  <option value="">Selecciona una mascota</option>
                  {mascotas.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nombre} · {m.especie}
                    </option>
                  ))}
                </select>
              </div>

              {/* Veterinario */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600">
                  Veterinario
                </label>
                <select
                  name="veterinario"
                  value={form.veterinario}
                  onChange={handleChangeVetOrFecha}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
                >
                  <option value="">Selecciona un veterinario</option>
                  {veterinarios.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.nombre ||
                        `${(v.first_name || "")} ${(v.last_name || "")}`
                          .trim() ||
                        v.email ||
                        `Veterinario #${v.id}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Fecha (calendario de días) + Box */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-600">
                  Fecha
                </label>

                {/* Navegación de semanas */}
                <div className="flex items-center justify-between mb-1">
                  <button
                    type="button"
                    onClick={() => handleWeekNav("prev")}
                    disabled={weekOffset === 0}
                    className="p-1 rounded-full border border-slate-300 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
                    {currentMonthLabel}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleWeekNav("next")}
                    className="p-1 rounded-full border border-slate-300 text-slate-600 hover:bg-slate-50"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                {/* Tira de días tipo calendario */}
                <div className="flex gap-1 overflow-x-auto pb-1">
                  {upcomingDays.map((d) => (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => handleSelectDia(d.value)}
                      className={
                        "flex flex-col items-center min-w-[3rem] px-2 py-1 rounded-lg border text-[11px] " +
                        (form.fecha === d.value
                          ? "bg-sky-600 text-white border-sky-600"
                          : "bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100")
                      }
                    >
                      <span className="uppercase tracking-wide text-[10px]">
                        {d.dow}
                      </span>
                      <span className="text-sm font-semibold">{d.dia}</span>
                    </button>
                  ))}
                </div>

                {/* Box */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-600">
                    Box (opcional)
                  </label>
                  <input
                    type="text"
                    name="box"
                    value={form.box}
                    onChange={handleChangeForm}
                    placeholder="Box 1, Box 2..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
                  />
                </div>
              </div>

              {/* Motivo (select + input cuando es "Otro motivo") */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600">
                  Motivo de consulta (opcional)
                </label>
                {motivosPredef.length === 0 ? (
                  <select
                    name="motivo"
                    value={form.motivo}
                    onChange={handleChangeForm}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
                  >
                    <option value="">
                      No se pudieron cargar los motivos. (opcional)
                    </option>
                  </select>
                ) : (
                  <select
                    name="motivo"
                    value={form.motivo}
                    onChange={handleChangeForm}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
                  >
                    <option value="">Selecciona un motivo</option>
                    {motivosPredef.map((m) => (
                      <option
                        key={m.codigo || m.nombre}
                        value={m.nombre}
                      >
                        {m.nombre}
                      </option>
                    ))}
                  </select>
                )}

                {/* Si el usuario escoge "Otro motivo", mostramos input libre */}
                {form.motivo === LABEL_OTRO_MOTIVO && (
                  <input
                    type="text"
                    name="motivoOtro"
                    value={form.motivoOtro}
                    onChange={handleChangeForm}
                    placeholder="Escribe el motivo de la consulta"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-300 mt-2"
                  />
                )}
              </div>

              {/* Horarios disponibles */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-600 flex items-center gap-1">
                    <Clock className="h-3 w-3 text-sky-500" />
                    Horarios disponibles
                  </label>
                  <button
                    type="button"
                    onClick={() => cargarSlotsCrear()}
                    className="text-[11px] text-sky-600 hover:underline"
                  >
                    Actualizar horarios
                  </button>
                </div>

                {loadingSlots ? (
                  <p className="text-xs text-slate-500">
                    Buscando disponibilidad...
                  </p>
                ) : !form.veterinario || !form.fecha ? (
                  <p className="text-xs text-slate-500">
                    Selecciona veterinario y fecha para ver horarios libres.
                  </p>
                ) : slots.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    No hay horarios disponibles para este día.
                  </p>
                ) : (
                  <div className="border border-slate-200 rounded-xl bg-slate-50 px-3 py-3">
                    <p className="text-[11px] text-slate-500 mb-2">
                      Horarios disponibles para{" "}
                      <span className="font-semibold">
                        {dayjs(form.fecha).format("ddd DD MMM YYYY")}
                      </span>
                    </p>

                    {/* Aquí eliges la hora, como en la foto */}
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                      {slots.map((h) => (
                        <label
                          key={h}
                          className={
                            "flex items-center justify-center rounded-lg border px-2 py-1.5 text-xs cursor-pointer select-none " +
                            (form.hora === h
                              ? "bg-sky-600 text-white border-sky-600"
                              : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100")
                          }
                        >
                          <input
                            type="radio"
                            name="hora"
                            value={h}
                            checked={form.hora === h}
                            onChange={() =>
                              setForm((prev) => ({
                                ...prev,
                                hora: h, // LA HORA VIENE DEL BACKEND
                              }))
                            }
                            className="hidden"
                          />
                          {h}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loadingForm}
                className="w-full mt-2 inline-flex items-center justify-center rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loadingForm ? "Creando cita..." : "Confirmar cita"}
              </button>

              <p className="flex items-start gap-2 text-[11px] text-slate-500 mt-2">
                <Info className="h-3 w-3 mt-0.5" />
                Recibirás la confirmación de tu cita una vez que sea validada
                por la clínica.
              </p>
            </form>
          </section>

          {/* Panel derecho: listado de citas */}
          <section className="bg-white/90 rounded-2xl border border-slate-200 shadow-sm p-4 md:p-5 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <CalendarDays className="h-5 w-5 text-sky-600" />
              <h2 className="text-sm font-semibold text-slate-900">
                Citas del día
              </h2>
            </div>

            {loading ? (
              <p className="text-sm text-slate-500">Cargando citas...</p>
            ) : citasOrdenadas.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-white/70 px-4 py-6 text-sm text-slate-500">
                No hay citas registradas para esta fecha. Crea una nueva cita en
                el panel izquierdo.
              </div>
            ) : (
              <ul className="space-y-3 text-sm">
                {citasOrdenadas.map((cita) => (
                  <li
                    key={cita.id}
                    className="rounded-xl border border-slate-200 bg-white/90 px-3 py-3 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center text-slate-500 mt-0.5">
                        <Clock className="h-4 w-4 mb-1" />
                        <span className="text-xs font-medium">
                          {cita.inicio
                            ? dayjs(cita.inicio).format("HH:mm")
                            : "--:--"}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">
                          {cita.mascota_nombre ||
                            `Mascota #${cita.mascota}`}
                        </p>
                        <p className="text-xs text-slate-600">
                          Vet:{" "}
                          <span className="font-medium">
                            {cita.veterinario_nombre ||
                              `Veterinario #${cita.veterinario}`}
                          </span>{" "}
                          · Box:{" "}
                          <span className="font-mono text-[11px]">
                            {cita.box || "N/A"}
                          </span>
                        </p>
                        {cita.motivo && (
                          <p className="text-xs text-slate-500 mt-0.5">
                            Motivo: {cita.motivo}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 md:justify-end">
                      <span className="inline-flex items-center rounded-full bg-sky-100 text-sky-700 text-[11px] px-2 py-1">
                        {cita.estado || "Pendiente"}
                      </span>
                      <button
                        type="button"
                        onClick={() => abrirModalReprogramar(cita)}
                        className="inline-flex items-center rounded-lg bg-sky-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-sky-700"
                      >
                        Reprogramar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCancelarCita(cita.id)}
                        className="inline-flex items-center rounded-lg border border-red-200 px-3 py-1.5 text-[11px] font-medium text-red-600 hover:bg-red-50"
                      >
                        Cancelar
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Modal reprogramar */}
        {showModal && selectedCita && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-5">
              <h3 className="text-base font-semibold text-slate-900 mb-3">
                Reprogramar cita #{selectedCita.id}
              </h3>

              <form onSubmit={handleSubmitReprogramar} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-700">
                    Nueva fecha
                  </label>
                  <input
                    type="date"
                    value={nuevaFecha}
                    onChange={handleFechaReprogChange}
                    className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-700">
                    Horarios disponibles
                  </label>
                  {loadingSlotsReprog ? (
                    <p className="text-xs text-slate-500">
                      Cargando horarios disponibles...
                    </p>
                  ) : slotsReprog.length === 0 ? (
                    <p className="text-xs text-slate-500">
                      No hay horarios disponibles para esta fecha.
                    </p>
                  ) : (
                    <div className="border border-slate-200 rounded-xl bg-slate-50 px-3 py-3">
                      <p className="text-[11px] text-slate-500 mb-2">
                        Horarios disponibles para{" "}
                        <span className="font-semibold">
                          {dayjs(nuevaFecha).format("ddd DD MMM YYYY")}
                        </span>
                      </p>

                      {/* selector de hora estilo grilla, similar a la referencia */}
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                        {slotsReprog.map((h) => (
                          <label
                            key={h}
                            className={
                              "flex items-center justify-center rounded-lg border px-2 py-1.5 text-xs cursor-pointer select-none " +
                              (slotSeleccionado === h
                                ? "bg-sky-600 text-white border-sky-600"
                                : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100")
                            }
                          >
                            <input
                              type="radio"
                              name="hora-reprog"
                              value={h}
                              checked={slotSeleccionado === h}
                              onChange={() => setSlotSeleccionado(h)}
                              className="hidden"
                            />
                            {h}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setSelectedCita(null);
                    }}
                    className="inline-flex items-center rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Cerrar
                  </button>
                  <button
                    type="submit"
                    disabled={!slotSeleccionado || savingReprog}
                    className="inline-flex items-center rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60 disabled:cursor-not-allowed hover:bg-sky-700"
                  >
                    {savingReprog ? "Guardando..." : "Confirmar cambio"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </LayoutCliente>
  );
}
