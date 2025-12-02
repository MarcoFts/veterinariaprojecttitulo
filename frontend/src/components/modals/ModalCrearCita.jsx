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


dayjs.locale("es");

const LABEL_OTRO_MOTIVO = "Otro motivo";

export default function ModalCrearCita({ open, slot, onClose, onConfirm }) {
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
    motivo: "",
    motivoOtro: "",
    box: "",
  });

  // --------- Mascotas filtradas SOLO del cliente elegido ---------
  const mascotasCliente = useMemo(() => {
    if (!form.cliente) return [];

    const idStr = String(form.cliente);

    // cliente seleccionado (para poder comparar por nombre si hace falta)
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

    // 1) Intentar por ID de cliente (todas las variantes típicas)
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

    if (porId.length > 0) {
      return porId;
    }

    // 2) Si no encontró por ID, intentar por nombre de cliente
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

    if (porNombre.length > 0) {
      return porNombre;
    }

    // 3) Fallback: si nada coincide, mostramos todas para no dejar el combo vacío
    return mascotas;
  }, [mascotas, form.cliente, clientes]);

  // 1) Al abrir el modal: cargar clientes + motivos
  useEffect(() => {
    if (!open || !slot) return;

    setForm({
      cliente: "",
      mascota: "",
      motivo: "",
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

        setClientes(cliRes.data || []);

        let base = motRes.data || [];
        const tieneOtro = base.some(
          (m) =>
            (m.nombre || "").toLowerCase() ===
            LABEL_OTRO_MOTIVO.toLowerCase()
        );
        if (!tieneOtro) {
          base = [...base, { codigo: "OTRO", nombre: LABEL_OTRO_MOTIVO }];
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

  // 2) Cada vez que cambia el cliente → pedir mascotas
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

        console.log("Mascotas recibidas para cliente", form.cliente, ">", lista);

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

const handleSubmit = async (e) => {
  e.preventDefault();
  if (!slot) return;

  if (!form.cliente || !form.mascota) {
    alert("Debes seleccionar cliente y mascota.");
    return;
  }

  if (!form.motivo) {
    alert("Debes seleccionar un motivo de consulta.");
    return;
  }

  if (form.motivo === LABEL_OTRO_MOTIVO && !form.motivoOtro.trim()) {
    alert("Por favor escribe el motivo de la consulta.");
    return;
  }

  const motivoFinal =
    form.motivo === LABEL_OTRO_MOTIVO ? form.motivoOtro.trim() : form.motivo;

  const fechaISO = slot.fecha;
  const inicioISO = `${fechaISO}T${slot.horaInicio}:00`;
  const finISO = `${fechaISO}T${slot.horaFin}:00`;

  const payload = {
    cliente_id: form.cliente,
    mascota_id: form.mascota,
    motivo: motivoFinal,
    box: form.box || "",
    inicio: inicioISO,
    fin: finISO,
  };

  setSaving(true);

  try {
    const res = await crearCita(payload);

    // 🔥 REFRESCA AGENDA DEL VETERINARIO
    if (onConfirm) onConfirm(res.data);

    // Cierra modal
    onClose && onClose();
  } catch (error) {
    console.error("Error al crear cita:", error);
    alert("Error al crear la cita.");
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
                  name="motivo"
                  value={form.motivo}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                >
                  <option value="">Selecciona un motivo</option>
                  {motivos.map((m) => (
                    <option key={m.codigo || m.nombre} value={m.nombre}>
                      {m.nombre}
                    </option>
                  ))}
                </select>

                {form.motivo === LABEL_OTRO_MOTIVO && (
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
