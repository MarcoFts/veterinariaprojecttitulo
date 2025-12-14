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

const inputBase =
  "h-10 border border-slate-200 rounded-md px-3 text-sm w-full bg-white focus:outline-none focus:ring-2 focus:ring-sky-400";

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

  const handleChangeFiltro = (e) => {
    const { name, value } = e.target;
    setFiltros((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "clienteId" ? { mascotaId: "" } : {}),
    }));
  };

  const cargarClientes = async () => {
    try {
      const resp = await getClientes();
      setClientes(resp.data || []);
    } catch {}
  };

  const cargarMascotas = async (clienteId) => {
    if (!clienteId) return setMascotas([]);
    try {
      const resp = await getMascotas({ cliente: clienteId });
      setMascotas(resp.data || []);
    } catch {}
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
    } catch {
      setError("No se pudieron cargar las citas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarClientes();
    cargarCitas();
  }, []);

  useEffect(() => {
    cargarMascotas(filtros.clienteId);
  }, [filtros.clienteId]);

  const rangoLabel = useMemo(() => {
    return `Entre ${dayjs(filtros.desde).format("DD-MM-YYYY")} y ${dayjs(
      filtros.hasta
    ).format("DD-MM-YYYY")}`;
  }, [filtros]);

  const citasOrdenadas = useMemo(
    () =>
      [...citas].sort(
        (a, b) => new Date(b.inicio).getTime() - new Date(a.inicio).getTime()
      ),
    [citas]
  );

  return (
    <LayoutVet>
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-sky-600" />
            Citas y estadísticas
          </h1>
          <p className="text-sm text-slate-500">
            Revisa el historial de reservas filtrando por cliente, mascota,
            estado y rango de fechas.
          </p>
        </header>

        <section className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500" />
              Filtros de búsqueda
            </h2>
            <span className="text-xs text-slate-500">{rangoLabel}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Campo label="Cliente" icon={<Users className="w-4 h-4 text-sky-500" />}>
              <select
                name="clienteId"
                value={filtros.clienteId}
                onChange={handleChangeFiltro}
                className={inputBase}
              >
                <option value="">Todos</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre || `Cliente #${c.id}`}
                  </option>
                ))}
              </select>
            </Campo>

            <Campo label="Mascota" icon={<Dog className="w-4 h-4 text-emerald-500" />}>
              <select
                name="mascotaId"
                value={filtros.mascotaId}
                onChange={handleChangeFiltro}
                disabled={!filtros.clienteId}
                className={inputBase}
              >
                <option value="">Todas</option>
                {mascotas.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nombre}
                  </option>
                ))}
              </select>
            </Campo>

            <Campo label="Estado de la cita">
              <select
                name="estado"
                value={filtros.estado}
                onChange={handleChangeFiltro}
                className={inputBase}
              >
                {ESTADOS.map((e) => (
                  <option key={e.value} value={e.value}>
                    {e.label}
                  </option>
                ))}
              </select>
            </Campo>

            <Campo label="Desde">
              <input
                type="date"
                name="desde"
                value={filtros.desde}
                onChange={handleChangeFiltro}
                className={inputBase}
              />
            </Campo>

            <Campo label="Hasta">
              <input
                type="date"
                name="hasta"
                value={filtros.hasta}
                onChange={handleChangeFiltro}
                className={inputBase}
              />
            </Campo>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={cargarCitas}
              disabled={loading}
              className="h-10 px-6 text-sm font-medium rounded-md bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-60"
            >
              {loading ? "Buscando..." : "Aplicar filtros"}
            </button>
          </div>
        </section>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-md">
            {error}
          </div>
        )}

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
              {citasOrdenadas.map((c) => (
                <CitaCard key={c.id} cita={c} />
              ))}
            </div>
          )}
        </section>
      </div>
    </LayoutVet>
  );
}

function Campo({ label, icon, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="h-5 flex items-center gap-1 text-xs font-medium text-slate-600">
        {icon}
        {label}
      </label>
      {children}
    </div>
  );
}

function CitaCard({ cita }) {
  const inicio = dayjs(cita.inicio);

  const estadoCls = {
    pendiente: "bg-slate-100 text-slate-700",
    confirmada: "bg-sky-100 text-sky-700",
    atendida: "bg-emerald-100 text-emerald-700",
    no_asistida: "bg-amber-100 text-amber-700",
    cancelada: "bg-rose-100 text-rose-700",
  };

  return (
    <article className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm flex items-center justify-between">
      <div className="space-y-1">
        <div className="text-xs text-slate-500">
          {inicio.format("DD-MM-YYYY")} · {inicio.format("HH:mm")} hrs
          {cita.box && ` · Box: ${cita.box}`}
        </div>
        <div className="text-sm font-semibold text-slate-900">
          {cita.mascota_nombre || "-"}
        </div>
        <div className="text-xs text-slate-500">
          {cita.cliente_nombre || "Sin cliente"}
        </div>
      </div>

      <span
        className={`px-2 py-1 rounded-full text-xs font-semibold ${
          estadoCls[cita.estado] || estadoCls.pendiente
        }`}
      >
        {cita.estado || "—"}
      </span>
    </article>
  );
}
