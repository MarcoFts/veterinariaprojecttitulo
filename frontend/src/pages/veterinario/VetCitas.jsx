// src/pages/veterinario/VetCitas.jsx
import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import "dayjs/locale/es";
dayjs.locale("es");

import LayoutVet from "../../components/layout/LayoutVet";
import { getClientes, getMascotas, getCitas } from "../../services/api";
import { CalendarDays, Users, Dog, Filter } from "lucide-react";

const ESTADOS = [
  { value: "", label: "Todos" },
  { value: "pendiente", label: "Pendiente" },
  { value: "confirmada", label: "Confirmada" },
  { value: "atendida", label: "Atendida" },
  { value: "no_asistida", label: "No asistida" },
  { value: "cancelada", label: "Cancelada" },
];

export default function VetCitas() {
  const hoy = dayjs().format("YYYY-MM-DD");
  const hace90dias = dayjs().subtract(90, "day").format("YYYY-MM-DD");

  const [clientes, setClientes] = useState([]);
  const [mascotas, setMascotas] = useState([]);
  const [citas, setCitas] = useState([]);

  const [filtros, setFiltros] = useState({
    desde: hace90dias,
    hasta: hoy,
    clienteId: "",
    mascotaId: "",
    estado: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ------ handlers ------
  const handleChangeFiltro = (e) => {
    const { name, value } = e.target;
    setFiltros((prev) => ({
      ...prev,
      [name]: value,
      // si se cambia el cliente, limpiamos mascota
      ...(name === "clienteId" ? { mascotaId: "" } : {}),
    }));
  };

  const cargarClientes = async () => {
    try {
      const resp = await getClientes();
      setClientes(resp.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const cargarMascotas = async (clienteId) => {
    if (!clienteId) {
      setMascotas([]);
      return;
    }
    try {
      const resp = await getMascotas({ cliente: clienteId });
      setMascotas(resp.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const cargarCitas = async () => {
    setLoading(true);
    setError("");

    try {
      const params = {};

      if (filtros.desde) params.desde = filtros.desde;
      if (filtros.hasta) params.hasta = filtros.hasta;
      if (filtros.clienteId) params.cliente = filtros.clienteId;
      if (filtros.mascotaId) params.mascota = filtros.mascotaId;
      if (filtros.estado) params.estado = filtros.estado;

      const resp = await getCitas(params);
      setCitas(resp.data || []);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar las citas. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  // carga inicial
  useEffect(() => {
    cargarClientes();
    cargarCitas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // cuando cambia cliente → recarga mascotas
  useEffect(() => {
    cargarMascotas(filtros.clienteId);
  }, [filtros.clienteId]);

  // para mostrar un “subtítulo” de periodo
  const rangoLabel = useMemo(() => {
    if (!filtros.desde && !filtros.hasta) return "Sin filtro de fechas";
    if (filtros.desde && filtros.hasta) {
      return `Entre ${dayjs(filtros.desde).format("DD-MM-YYYY")} y ${dayjs(
        filtros.hasta
      ).format("DD-MM-YYYY")}`;
    }
    if (filtros.desde) {
      return `Desde ${dayjs(filtros.desde).format("DD-MM-YYYY")}`;
    }
    return `Hasta ${dayjs(filtros.hasta).format("DD-MM-YYYY")}`;
  }, [filtros.desde, filtros.hasta]);

  // ordenar por fecha desc
  const citasOrdenadas = useMemo(() => {
    return [...citas].sort(
      (a, b) => new Date(b.inicio).getTime() - new Date(a.inicio).getTime()
    );
  }, [citas]);

  return (
    <LayoutVet>
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Título */}
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-sky-600" />
            Citas y estadísticas
          </h1>
          <p className="text-sm text-slate-500">
            Revisa el <span className="font-semibold">historial de reservas</span>{" "}
            filtrando por cliente, mascota, estado y rango de fechas.
          </p>
        </header>

        {/* Filtros */}
        <section className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500" />
              Filtros de búsqueda
            </h2>
            <span className="text-xs text-slate-500">{rangoLabel}</span>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            {/* Cliente */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600 flex items-center gap-1">
                <Users className="w-4 h-4 text-sky-500" />
                Cliente
              </label>
              <select
                name="clienteId"
                value={filtros.clienteId}
                onChange={handleChangeFiltro}
                className="border border-slate-200 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
              >
                <option value="">Todos</option>
                {clientes.map((cli) => (
                  <option key={cli.id} value={cli.id}>
                    {cli.nombre || `Cliente #${cli.id}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Mascota */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600 flex items-center gap-1">
                <Dog className="w-4 h-4 text-emerald-500" />
                Mascota
              </label>
              <select
                name="mascotaId"
                value={filtros.mascotaId}
                onChange={handleChangeFiltro}
                className="border border-slate-200 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                disabled={!filtros.clienteId}
              >
                <option value="">
                  {filtros.clienteId ? "Todas" : "Selecciona un cliente primero"}
                </option>
                {mascotas.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Estado */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">
                Estado de la cita
              </label>
              <select
                name="estado"
                value={filtros.estado}
                onChange={handleChangeFiltro}
                className="border border-slate-200 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
              >
                {ESTADOS.map((e) => (
                  <option key={e.value} value={e.value}>
                    {e.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Fechas */}
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs font-medium text-slate-600">
                    Desde
                  </label>
                  <input
                    type="date"
                    name="desde"
                    value={filtros.desde}
                    onChange={handleChangeFiltro}
                    className="border border-slate-200 rounded-md px-2 py-1.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-medium text-slate-600">
                    Hasta
                  </label>
                  <input
                    type="date"
                    name="hasta"
                    value={filtros.hasta}
                    onChange={handleChangeFiltro}
                    className="border border-slate-200 rounded-md px-2 py-1.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={cargarCitas}
                disabled={loading}
                className="mt-auto self-end px-4 py-1.5 text-xs font-medium rounded-md bg-sky-600 text-white hover:bg-sky-700 shadow-sm disabled:opacity-60"
              >
                {loading ? "Buscando..." : "Aplicar filtros"}
              </button>
            </div>
          </div>
        </section>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-md">
            {error}
          </div>
        )}

        {/* LISTA / HISTORIAL */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-800">
            Historial de reservas ({citasOrdenadas.length})
          </h2>

          {citasOrdenadas.length === 0 ? (
            <p className="text-sm text-slate-500">
              No se encontraron citas con los filtros seleccionados.
            </p>
          ) : (
            <div className="space-y-2">
              {citasOrdenadas.map((cita) => (
                <CitaCard key={cita.id} cita={cita} />
              ))}
            </div>
          )}
        </section>
      </div>
    </LayoutVet>
  );
}

function CitaCard({ cita }) {
  const inicio = dayjs(cita.inicio);
  const fecha = inicio.format("DD-MM-YYYY");
  const hora = inicio.format("HH:mm");

  const clienteNombre =
  cita.cliente_nombre && cita.cliente_nombre.trim()
    ? cita.cliente_nombre
    : "Sin cliente";

  const mascotaNombre = cita.mascota_nombre || cita.mascota?.nombre || "-";

  const estadoLabel = (() => {
    switch (cita.estado) {
      case "pendiente":
        return { text: "Pendiente", cls: "bg-slate-100 text-slate-700" };
      case "confirmada":
        return { text: "Confirmada", cls: "bg-sky-100 text-sky-700" };
      case "atendida":
        return { text: "Atendida", cls: "bg-emerald-100 text-emerald-700" };
      case "no_asistida":
        return { text: "No asistió", cls: "bg-amber-100 text-amber-700" };
      case "cancelada":
        return { text: "Cancelada", cls: "bg-rose-100 text-rose-700" };
      default:
        return { text: cita.estado || "—", cls: "bg-slate-100 text-slate-700" };
    }
  })();

  return (
    <article className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-2">
      <div className="flex flex-col gap-1">
        <div className="text-xs text-slate-500">
          {fecha} · {hora} hrs
          {cita.box ? ` · Box: ${cita.box}` : ""}
        </div>
        <div className="text-sm font-semibold text-slate-900">
          {mascotaNombre}
        </div>
        <div className="text-xs text-slate-500">{clienteNombre}</div>
        {cita.motivo && (
          <div className="text-xs text-slate-500 mt-1">
            Motivo: <span className="font-medium">{cita.motivo}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 md:flex-col md:items-end">
        <span
          className={`px-2 py-1 rounded-full text-xs font-semibold ${estadoLabel.cls}`}
        >
          {estadoLabel.text}
        </span>
      </div>
    </article>
  );
}
