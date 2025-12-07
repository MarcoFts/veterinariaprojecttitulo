// src/pages/veterinario/VetReportes.jsx
import { useEffect, useState, useMemo } from "react";
import dayjs from "dayjs";
import "dayjs/locale/es";
dayjs.locale("es");

import LayoutVet from "../../components/layout/LayoutVet";
import { getReporteAgenda, getReporteInventario } from "../../services/api";
import { BarChart2, Activity, PackageSearch } from "lucide-react";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";

export default function VetReportes() {
  const hoy = dayjs().format("YYYY-MM-DD");
  // 👇 Ampliamos el rango por defecto a 90 días
  const hace90dias = dayjs().subtract(90, "day").format("YYYY-MM-DD");

  const [filtros, setFiltros] = useState({
    desde: hace90dias,
    hasta: hoy,
  });

  const [agenda, setAgenda] = useState(null);
  const [inventario, setInventario] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChangeFiltro = (e) => {
    const { name, value } = e.target;
    setFiltros((prev) => ({ ...prev, [name]: value }));
  };

  const cargarReportes = async () => {
    setLoading(true);
    setError("");

    try {
      const [agendaData, inventarioData] = await Promise.all([
        getReporteAgenda({
          desde: filtros.desde,
          hasta: filtros.hasta,
        }),
        getReporteInventario({ dias_alerta: 60 }), // ventana de vencimientos
      ]);

      setAgenda(agendaData);
      setInventario(inventarioData);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar los reportes. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarReportes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Datos para gráficos ----
  const dataAgendaPorDia = useMemo(() => {
    if (!agenda?.por_dia) return [];
    return agenda.por_dia.map((d) => ({
      ...d,
      fechaLabel: dayjs(d.fecha).format("DD-MM"),
    }));
  }, [agenda]);

  const dataAgendaPorVet = useMemo(() => {
    if (!agenda?.por_veterinario) return [];
    return agenda.por_veterinario.map((v) => ({
      ...v,
      nombreCorto: v.nombre || `ID ${v.id}`,
    }));
  }, [agenda]);

  const dataInventarioCriticos = useMemo(() => {
    if (!inventario?.criticos) return [];
    return inventario.criticos.map((p) => ({
      ...p,
      nombreCorto: p.nombre.length > 12 ? p.nombre.slice(0, 12) + "…" : p.nombre,
    }));
  }, [inventario]);

  return (
    <LayoutVet>
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Título y filtros */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <BarChart2 className="w-6 h-6 text-sky-600" />
              Reportes de gestión
            </h1>
            <p className="text-sm text-slate-500">
              Ocupación de agenda, pendientes, no-shows y estado del inventario.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex flex-col">
              <label className="text-xs font-medium text-slate-600">
                Desde
              </label>
              <input
                type="date"
                name="desde"
                value={filtros.desde}
                onChange={handleChangeFiltro}
                className="border border-slate-200 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-xs font-medium text-slate-600">
                Hasta
              </label>
              <input
                type="date"
                name="hasta"
                value={filtros.hasta}
                onChange={handleChangeFiltro}
                className="border border-slate-200 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
            </div>

            <button
              onClick={cargarReportes}
              className="px-4 py-2 rounded-md text-sm font-medium bg-sky-600 text-white hover:bg-sky-700 shadow-sm disabled:opacity-60"
              disabled={loading}
            >
              {loading ? "Actualizando..." : "Aplicar filtros"}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-md">
            {error}
          </div>
        )}

        {/* Sección: Reporte de Agenda */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Activity className="w-5 h-5 text-sky-600" />
            Agenda y asistencia
          </h2>

          {!agenda ? (
            <p className="text-sm text-slate-500">
              No hay datos de agenda en el rango seleccionado.
            </p>
          ) : (
            <>
              {/* Resumen agenda */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <ResumenCard
                  label="Total citas"
                  value={agenda.resumen.total_citas}
                  accent="bg-sky-100 text-sky-700"
                />
                <ResumenCard
                  label="Pendientes"
                  value={agenda.resumen.pendientes}
                  accent="bg-slate-100 text-slate-700"
                />
                <ResumenCard
                  label="Confirmadas"
                  value={agenda.resumen.confirmadas}
                  accent="bg-sky-100 text-sky-700"
                />
                <ResumenCard
                  label="Atendidas"
                  value={agenda.resumen.atendidas}
                  accent="bg-emerald-100 text-emerald-700"
                />
                <ResumenCard
                  label="No asistidas"
                  value={agenda.resumen.no_asistidas}
                  accent="bg-amber-100 text-amber-700"
                />
                <ResumenCard
                  label="Canceladas"
                  value={agenda.resumen.canceladas}
                  accent="bg-rose-100 text-rose-700"
                />
              </div>

              {/* Gráfico: ocupación por día */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-800">
                    Ocupación por día (gráfico)
                  </h3>
                  <span className="text-xs text-slate-500">
                    Citas pendientes, confirmadas, atendidas, no asistidas y
                    canceladas
                  </span>
                </div>
                {dataAgendaPorDia.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    No hay citas registradas en este periodo.
                  </p>
                ) : (
                  <div className="w-full h-64">
                    <ResponsiveContainer>
                      <BarChart data={dataAgendaPorDia}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="fechaLabel" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar
                          dataKey="pendientes"
                          name="Pendientes"
                          fill="#64748b" // slate-500
                        />
                        <Bar
                          dataKey="confirmadas"
                          name="Confirmadas"
                          fill="#0ea5e9" // sky-500
                        />
                        <Bar
                          dataKey="atendidas"
                          name="Atendidas"
                          fill="#22c55e" // emerald-500
                        />
                        <Bar
                          dataKey="no_asistidas"
                          name="No asistidas"
                          fill="#f59e0b" // amber-500
                        />
                        <Bar
                          dataKey="canceladas"
                          name="Canceladas"
                          fill="#fb7185" // rose-400
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Tabla por día */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-4 py-2 border-b bg-slate-50 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-800">
                    Ocupación por día (detalle)
                  </h3>
                  <span className="text-xs text-slate-500">
                    Citas por estado y por fecha
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <Th>Fecha</Th>
                        <Th>Total</Th>
                        <Th>Pendientes</Th>
                        <Th>Confirmadas</Th>
                        <Th>Atendidas</Th>
                        <Th>No asistidas</Th>
                        <Th>Canceladas</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {agenda.por_dia.length === 0 ? (
                        <tr>
                          <td
                            colSpan={7}
                            className="px-4 py-3 text-center text-slate-500"
                          >
                            No hay citas registradas en este periodo.
                          </td>
                        </tr>
                      ) : (
                        agenda.por_dia.map((dia) => (
                          <tr key={dia.fecha} className="border-t">
                            <Td>{dayjs(dia.fecha).format("DD-MM-YYYY")}</Td>
                            <Td>{dia.total_citas}</Td>
                            <Td>{dia.pendientes ?? 0}</Td>
                            <Td>{dia.confirmadas ?? 0}</Td>
                            <Td>{dia.atendidas}</Td>
                            <Td>{dia.no_asistidas}</Td>
                            <Td>{dia.canceladas}</Td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Gráfico por veterinario */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-800">
                    Desempeño por veterinario (gráfico)
                  </h3>
                  <span className="text-xs text-slate-500">
                    Pendientes, confirmadas, atenciones y no-shows por
                    veterinario
                  </span>
                </div>
                {dataAgendaPorVet.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    No hay datos por veterinario en este periodo.
                  </p>
                ) : (
                  <div className="w-full h-64">
                    <ResponsiveContainer>
                      <BarChart data={dataAgendaPorVet}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="nombreCorto" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar
                          dataKey="pendientes"
                          name="Pendientes"
                          fill="#64748b" // slate-500
                        />
                        <Bar
                          dataKey="confirmadas"
                          name="Confirmadas"
                          fill="#0ea5e9" // sky-500
                        />
                        <Bar
                          dataKey="atendidas"
                          name="Atendidas"
                          fill="#22c55e" // emerald-500
                        />
                        <Bar
                          dataKey="no_asistidas"
                          name="No asistidas"
                          fill="#f97316" // orange-500
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Tabla por veterinario */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-4 py-2 border-b bg-slate-50 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-800">
                    Desempeño por veterinario (detalle)
                  </h3>
                  <span className="text-xs text-slate-500">
                    Distribución de citas por estado
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <Th>Veterinario</Th>
                        <Th>Total citas</Th>
                        <Th>Pendientes</Th>
                        <Th>Confirmadas</Th>
                        <Th>Atendidas</Th>
                        <Th>No asistidas</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {agenda.por_veterinario.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-4 py-3 text-center text-slate-500"
                          >
                            No hay datos por veterinario en este periodo.
                          </td>
                        </tr>
                      ) : (
                        agenda.por_veterinario.map((vet) => (
                          <tr key={vet.id} className="border-t">
                            <Td>{vet.nombre || `ID ${vet.id}`}</Td>
                            <Td>{vet.total_citas}</Td>
                            <Td>{vet.pendientes ?? 0}</Td>
                            <Td>{vet.confirmadas ?? 0}</Td>
                            <Td>{vet.atendidas}</Td>
                            <Td>{vet.no_asistidas}</Td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </section>

        {/* Sección: Reporte de Inventario */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <PackageSearch className="w-5 h-5 text-sky-600" />
            Inventario de insumos
          </h2>

          {!inventario ? (
            <p className="text-sm text-slate-500">
              No hay datos de inventario disponibles.
            </p>
          ) : (
            <>
              {/* Resumen inventario */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <ResumenCard
                  label="Total productos"
                  value={inventario.resumen.total_productos}
                  accent="bg-sky-100 text-sky-700"
                />
                <ResumenCard
                  label="Con stock"
                  value={inventario.resumen.con_stock}
                  accent="bg-emerald-100 text-emerald-700"
                />
                <ResumenCard
                  label="Sin stock"
                  value={inventario.resumen.sin_stock}
                  accent="bg-slate-100 text-slate-700"
                />
                <ResumenCard
                  label="Bajo stock"
                  value={inventario.resumen.bajo_stock}
                  accent="bg-amber-100 text-amber-700"
                />
                <ResumenCard
                  label="Próx. a vencer"
                  value={inventario.resumen.proximos_a_vencer}
                  accent="bg-rose-100 text-rose-700"
                />
              </div>

              {/* Gráfico: productos críticos (stock vs mínimo) */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-800">
                    Productos en stock crítico (gráfico)
                  </h3>
                <span className="text-xs text-slate-500">
                    Comparación entre stock actual y stock mínimo
                  </span>
                </div>
                {dataInventarioCriticos.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    No hay productos en estado crítico.
                  </p>
                ) : (
                  <div className="w-full h-64">
                    <ResponsiveContainer>
                      <BarChart data={dataInventarioCriticos}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="nombreCorto" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar
                          dataKey="stock"
                          name="Stock actual"
                          fill="#0ea5e9" // sky-500
                        />
                        <Bar
                          dataKey="stock_minimo"
                          name="Stock mínimo"
                          fill="#64748b" // slate-500
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Tabla productos críticos */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-4 py-2 border-b bg-slate-50 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-800">
                    Productos en stock crítico (detalle)
                  </h3>
                  <span className="text-xs text-slate-500">
                    Productos con stock igual o por debajo del mínimo
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <Th>Nombre</Th>
                        <Th>Categoría</Th>
                        <Th>Stock</Th>
                        <Th>Stock mínimo</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventario.criticos.length === 0 ? (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-4 py-3 text-center text-slate-500"
                          >
                            No hay productos en estado crítico.
                          </td>
                        </tr>
                      ) : (
                        inventario.criticos.map((p) => (
                          <tr key={p.id} className="border-t">
                            <Td>{p.nombre}</Td>
                            <Td>{p.categoria || "-"}</Td>
                            <Td>{p.stock}</Td>
                            <Td>{p.stock_minimo}</Td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Tabla productos próximos a vencer */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-4 py-2 border-b bg-slate-50 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-800">
                    Productos próximos a vencer
                  </h3>
                  <span className="text-xs text-slate-500">
                    Dentro de {inventario.dias_alerta} días
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <Th>Nombre</Th>
                        <Th>Categoría</Th>
                        <Th>Stock</Th>
                        <Th>Fecha vencimiento</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventario.proximos_a_vencer.length === 0 ? (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-4 py-3 text-center text-slate-500"
                          >
                            No hay productos próximos a vencer.
                          </td>
                        </tr>
                      ) : (
                        inventario.proximos_a_vencer.map((p) => (
                          <tr key={p.id} className="border-t">
                            <Td>{p.nombre}</Td>
                            <Td>{p.categoria || "-"}</Td>
                            <Td>{p.stock}</Td>
                            <Td>
                              {p.fecha_vencimiento
                                ? dayjs(p.fecha_vencimiento).format(
                                    "DD-MM-YYYY"
                                  )
                                : "-"}
                            </Td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </LayoutVet>
  );
}

function ResumenCard({ label, value, accent = "bg-slate-100 text-slate-700" }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-3 py-3 shadow-sm flex flex-col gap-1">
      <div className="text-xs text-slate-500">{label}</div>
      <div
        className={`inline-flex items-center justify-center px-2 py-1 rounded-lg text-sm font-semibold ${accent}`}
      >
        {value ?? 0}
      </div>
    </div>
  );
}

function Th({ children }) {
  return (
    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">
      {children}
    </th>
  );
}

function Td({ children }) {
  return <td className="px-4 py-2 text-sm text-slate-800">{children}</td>;
}
