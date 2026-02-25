// src/components/modals/ModalCrearCita.jsx
import { useEffect, useMemo, useState } from "react";
import { CalendarClock, UserCircle2, X } from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/es";
import {
  getClientes,
  getMascotas,
  getMotivosConsulta,
} from "../../services/api";
import { crearCita } from "../../services/citas";
import { useAuth } from "../../context/AuthContext";

dayjs.locale("es");

const CODIGO_OTRO = "otro";

export default function ModalCrearCita({ open, slot, onClose, onConfirm }) {
  const { user } = useAuth(); // veterinario logueado

  const [clientes, setClientes] = useState([]);
  const [mascotas, setMascotas] = useState([]);
  const [motivos, setMotivos] = useState([]);

  const [loadingDatos, setLoadingDatos] = useState(false);
  const [loadingMascotas, setLoadingMascotas] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    cliente: "",
    mascota: "",
    motivoCodigo: "",
    motivoOtro: "",
    box: "",
  });

  // Mascotas filtradas solo del cliente elegido
  const mascotasCliente = useMemo(() => {
    if (!form.cliente) return [];

    const idStr = String(form.cliente);

    const clienteSel = clientes.find(
      (c) => String(c.id) === String(form.cliente)
    );
    const nombreCliente =
      clienteSel?.nombre_completo ||
      clienteSel?.nombre ||
      clienteSel?.email ||
      "";

    const normalizar = (txt) =>
      String(txt || "")
        .toLowerCase()
        .trim();

    const porId = mascotas.filter((m) => {
      const posiblesIds = [
        m.cliente,
        m.cliente_id,
        m.clienteId,
        m.cliente_pk,
        m.cliente?.id,
        m.cliente?.pk,
        m.cliente?.cliente_id,
      ]
        .filter((v) => v !== undefined && v !== null)
        .map((v) => String(v));

      return posiblesIds.includes(idStr);
    });

    if (porId.length > 0) return porId;

    const porNombre = mascotas.filter((m) => {
      const posibleNombre =
        m.cliente_nombre ||
        m.cliente?.nombre_completo ||
        m.cliente?.nombre ||
        "";

      return (
        nombreCliente &&
        normalizar(posibleNombre) === normalizar(nombreCliente)
      );
    });

    if (porNombre.length > 0) return porNombre;

    return mascotas;
  }, [mascotas, form.cliente, clientes]);

  // Al abrir el modal: reset y cargar clientes + motivos
  useEffect(() => {
    if (!open || !slot) return;

    setForm({
      cliente: "",
      mascota: "",
      motivoCodigo: "",
      motivoOtro: "",
      box: slot.box || "",
    });
    setError("");
    setMascotas([]);

    const cargarDatos = async () => {
      setLoadingDatos(true);
      try {
        const [cliRes, motRes] = await Promise.all([
          getClientes(),
          getMotivosConsulta(),
        ]);

        setClientes(Array.isArray(cliRes.data) ? cliRes.data : []);

        let base = motRes.data || [];

        const tieneOtro = base.some(
          (m) => (m.codigo || "").toLowerCase() === CODIGO_OTRO
        );
        if (!tieneOtro) {
          base = [
            ...base,
            { id: "otro-local", codigo: CODIGO_OTRO, nombre: "Otro motivo" },
          ];
        }

        setMotivos(base);
      } catch (err) {
        console.error("Error cargando datos del modal:", err);
        setError("No se pudieron cargar los datos desde el servidor.");
      } finally {
        setLoadingDatos(false);
      }
    };

    cargarDatos();
  }, [open, slot]);

  // Cada vez que cambia el cliente → pedir mascotas
  useEffect(() => {
    if (!open) return;

    if (!form.cliente) {
      setMascotas([]);
      return;
    }

    const cargarMascotas = async () => {
      setLoadingMascotas(true);
      try {
        const res = await getMascotas({
          cliente: form.cliente,
          cliente_id: form.cliente,
        });

        const lista = Array.isArray(res.data)
          ? res.data
          : res.data?.results || [];

        setMascotas(lista);
      } catch (err) {
        console.error("Error cargando mascotas:", err);
        setError("No se pudieron cargar las mascotas de ese cliente.");
        setMascotas([]);
      } finally {
        setLoadingMascotas(false);
      }
    };

    cargarMascotas();
  }, [open, form.cliente]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "cliente" ? { mascota: "" } : {}),
    }));
  };

  // Resuelve nombre legible del cliente para usarlo al actualizar el slot en la agenda
  const getNombreClienteSeleccionado = () => {
    const c = clientes.find(
      (cli) => String(cli.id) === String(form.cliente)
    );
    return (
      c?.nombre_completo ||
      c?.nombre ||
      c?.email ||
      (c ? `Cliente #${c.id}` : "")
    );
  };

  // Resuelve nombre de la mascota seleccionada
  const getNombreMascotaSeleccionada = () => {
    const m = mascotasCliente.find(
      (masc) => String(masc.id) === String(form.mascota)
    );
    if (!m) return "";
    return m.nombre || `Mascota #${m.id}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!slot) return;

    if (!form.cliente || !form.mascota) {
      alert("Debes seleccionar cliente y mascota.");
      return;
    }

    if (!form.motivoCodigo) {
      alert("Debes seleccionar un motivo de consulta.");
      return;
    }

    // Motivo final que va como texto plano al backend
    let motivoFinal = "";

    if (form.motivoCodigo === CODIGO_OTRO) {
      if (!form.motivoOtro.trim()) {
        alert("Por favor escribe el motivo de la consulta.");
        return;
      }
      motivoFinal = form.motivoOtro.trim();
    } else {
      const motivoObj = motivos.find(
        (m) => (m.codigo || "").toLowerCase() === form.motivoCodigo.toLowerCase()
      );
      motivoFinal = motivoObj?.nombre || "Motivo de consulta";
    }

    const fechaISO = slot.fecha;
    const inicioISO = `${fechaISO}T${slot.horaInicio}:00`;
    const finISO = `${fechaISO}T${slot.horaFin}:00`;

    const vetIdRaw =
      user?.veterinario_id ??
      user?.id ??
      user?.user_id ??
      null;

    if (!vetIdRaw) {
      console.error("No se pudo determinar el veterinario desde user:", user);
      alert(
        "No se encontró el veterinario asociado a este horario. Revisa la sesión."
      );
      return;
    }

    const payload = {
      cliente_id: Number(form.cliente),
      mascota_id: Number(form.mascota),
      veterinario_id: Number(vetIdRaw),
      motivo: motivoFinal,
      box: form.box || slot.box || "",
      inicio: inicioISO,
      fin: finISO,
    };

    setSaving(true);
    setError("");

    try {
      const res = await crearCita(payload);

      const clienteNombre = getNombreClienteSeleccionado();
      const mascotaNombre = getNombreMascotaSeleccionada();

      // Avisamos al padre con los datos que necesita para actualizar el slot
      if (onConfirm) {
        onConfirm({
          slot_id: slot.id,
          cita_id: res?.data?.id,
          cliente_nombre: clienteNombre,
          mascota_nombre: mascotaNombre,
          motivo: motivoFinal,
          box: payload.box,
        });
      }

      onClose && onClose();
    } catch (error) {
      console.error("Error al crear cita:", error);
      const data = error?.response?.data;
      let msg = "Error al crear la cita.";

      if (data) {
        if (typeof data === "string") {
          msg = data;
        } else if (Array.isArray(data.non_field_errors) && data.non_field_errors[0]) {
          msg = data.non_field_errors[0];
        } else if (typeof data.detail === "string") {
          msg = data.detail;
        }
      }

      setError(msg);
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  if (!open || !slot) return null;

  const rangoHora = `${slot.horaInicio || ""} - ${slot.horaFin || ""}`;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-sky-100 flex items-center justify-center">
              <CalendarClock className="h-4 w-4 text-sky-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Asignar cita
              </p>
              <p className="text-xs text-slate-500">{rangoHora}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1 rounded-full hover:bg-slate-100 text-slate-500"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4 text-sm">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
              {error}
            </div>
          )}

          {loadingDatos ? (
            <p className="text-xs text-slate-500">Cargando datos...</p>
          ) : (
            <>
              {/* Cliente */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 flex items-center gap-1">
                  <UserCircle2 className="h-3 w-3 text-sky-500" />
                  Cliente
                </label>
                <select
                  name="cliente"
                  value={form.cliente}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                >
                  <option value="">Selecciona un cliente</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre_completo ||
                        c.nombre ||
                        c.email ||
                        `Cliente #${c.id}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mascota */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">
                  Mascota
                </label>
                <select
                  name="mascota"
                  value={form.mascota}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                  disabled={!form.cliente || loadingMascotas}
                >
                  <option value="">
                    {form.cliente
                      ? loadingMascotas
                        ? "Cargando mascotas..."
                        : "Selecciona una mascota"
                      : "Primero selecciona un cliente"}
                  </option>
                  {mascotasCliente.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nombre} · {m.especie}
                    </option>
                  ))}
                </select>
              </div>

              {/* Motivo */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">
                  Motivo de la cita
                </label>
                <select
                  name="motivoCodigo"
                  value={form.motivoCodigo}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                >
                  <option value="">Selecciona un motivo</option>
                  {motivos.map((m) => (
                    <option key={m.id || m.codigo || m.nombre} value={m.codigo}>
                      {m.nombre}
                    </option>
                  ))}
                </select>

                {form.motivoCodigo === CODIGO_OTRO && (
                  <input
                    type="text"
                    name="motivoOtro"
                    value={form.motivoOtro}
                    onChange={handleChange}
                    placeholder="Escribe el motivo de la consulta"
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                )}
              </div>

              {/* Box opcional */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">
                  Box (opcional)
                </label>
                <input
                  type="text"
                  name="box"
                  value={form.box}
                  onChange={handleChange}
                  placeholder="BOX-1"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Botones */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
                >
                  {saving ? "Guardando..." : "Guardar cita"}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
