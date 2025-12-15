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
        getReporteInventario({ dias_alerta: 60 }),
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

  // ---- NUEVO: Motivos y recurrentes ----
  const dataMotivosTop = useMemo(() => {
    if (!agenda?.motivos?.top) return [];
    return agenda.motivos.top.map((m) => ({
      ...m,
      motivoCorto: m.motivo?.length > 18 ? m.motivo.slice(0, 18) + "…" : m.motivo,
    }));
  }, [agenda]);

  const dataTopMascotas = useMemo(() => {
    if (!agenda?.top_mascotas) return [];
    return agenda.top_mascotas.map((m) => ({
      ...m,
      nombreCorto: m.nombre?.length > 16 ? m.nombre.slice(0, 16) + "…" : m.nombre,
    }));
  }, [agenda]);

  const dataTopClientes = useMemo(() => {
    if (!agenda?.top_clientes) return [];
    return agenda.top_clientes.map((c) => ({
      ...c,
      nombreCorto: c.nombre?.length > 16 ? c.nombre.slice(0, 16) + "…" : c.nombre,
    }));
  }, [agenda]);

  // ---- ✅ NUEVO: Por raza (Top 10) ----
  const dataPorRaza = useMemo(() => {
    if (!agenda?.por_raza) return [];
    return agenda.por_raza.map((r) => ({
      ...r,
      raza: r.raza || "Sin raza",
      razaCorta: (r.raza || "Sin raza").length > 18
        ? (r.raza || "Sin raza").slice(0, 18) + "…"
        : (r.raza || "Sin raza"),
    }));
  }, [agenda]);

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
              Ocupación de agenda, motivos más solicitados y estado del inventario.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex flex-col">
              <label className="text-xs font-medium text-slate-600">Desde</label>
              <input
                type="date"
                name="desde"
                value={filtros.desde}
                onChange={handleChangeFiltro}
                className="border border-slate-200 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-xs font-medium text-slate-600">Hasta</label>
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
                  value={agenda.resumen?.total_citas}
                  accent="bg-sky-100 text-sky-700"
                />
                <ResumenCard
                  label="Pendientes"
                  value={agenda.resumen?.pendientes}
                  accent="bg-slate-100 text-slate-700"
                />
                <ResumenCard
                  label="Confirmadas"
                  value={agenda.resumen?.confirmadas}
                  accent="bg-sky-100 text-sky-700"
                />
                <ResumenCard
                  label="Atendidas"
                  value={agenda.resumen?.atendidas}
                  accent="bg-emerald-100 text-emerald-700"
                />
                <ResumenCard
                  label="No asistidas"
                  value={agenda.resumen?.no_asistidas}
                  accent="bg-amber-100 text-amber-700"
                />
                <ResumenCard
                  label="Canceladas"
                  value={agenda.resumen?.canceladas}
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
                    Citas pendientes, confirmadas, atendidas, no asistidas y canceladas
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
                        <Bar dataKey="pendientes" name="Pendientes" fill="#64748b" />
                        <Bar dataKey="confirmadas" name="Confirmadas" fill="#0ea5e9" />
                        <Bar dataKey="atendidas" name="Atendidas" fill="#22c55e" />
                        <Bar dataKey="no_asistidas" name="No asistidas" fill="#f59e0b" />
                        <Bar dataKey="canceladas" name="Canceladas" fill="#fb7185" />
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
                      {(agenda.por_dia || []).length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-3 text-center text-slate-500">
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
                            <Td>{dia.atendidas ?? 0}</Td>
                            <Td>{dia.no_asistidas ?? 0}</Td>
                            <Td>{dia.canceladas ?? 0}</Td>
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
                    Pendientes, confirmadas, atenciones y no-shows por veterinario
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
                        <Bar dataKey="pendientes" name="Pendientes" fill="#64748b" />
                        <Bar dataKey="confirmadas" name="Confirmadas" fill="#0ea5e9" />
                        <Bar dataKey="atendidas" name="Atendidas" fill="#22c55e" />
                        <Bar dataKey="no_asistidas" name="No asistidas" fill="#f97316" />
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
                      {(agenda.por_veterinario || []).length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-3 text-center text-slate-500">
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
                            <Td>{vet.atendidas ?? 0}</Td>
                            <Td>{vet.no_asistidas ?? 0}</Td>
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

        {/* ✅ NUEVO: Motivos de consulta */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Activity className="w-5 h-5 text-sky-600" />
            Motivos de consulta
          </h2>

          {!agenda?.motivos ? (
            <p className="text-sm text-slate-500">
              No hay datos de motivos en el rango seleccionado.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <ResumenCard
                  label="Sin motivo"
                  value={agenda.motivos.sin_motivo ?? 0}
                  accent="bg-slate-100 text-slate-700"
                />
                <ResumenCard
                  label="Motivo top"
                  value={agenda.motivos.top?.[0]?.motivo || "-"}
                  accent="bg-sky-100 text-sky-700"
                />
                <ResumenCard
                  label="Cantidad motivo top"
                  value={agenda.motivos.top?.[0]?.total ?? 0}
                  accent="bg-emerald-100 text-emerald-700"
                />
              </div>

              {/* Gráfico top motivos */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-800">
                    Motivos más solicitados (Top 10)
                  </h3>
                  <span className="text-xs text-slate-500">
                    Basado en citas no canceladas
                  </span>
                </div>

                {dataMotivosTop.length === 0 ? (
                  <p className="text-xs text-slate-500">No hay datos para este periodo.</p>
                ) : (
                  <div className="w-full h-64">
                    <ResponsiveContainer>
                      <BarChart data={dataMotivosTop}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="motivoCorto" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="total" name="Cantidad" fill="#0ea5e9" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Tabla top motivos */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-4 py-2 border-b bg-slate-50 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-800">
                    Motivos más solicitados (detalle)
                  </h3>
                  <span className="text-xs text-slate-500">Top 10</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <Th>Motivo</Th>
                        <Th>Cantidad</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {(agenda.motivos.top || []).length === 0 ? (
                        <tr>
                          <td colSpan={2} className="px-4 py-3 text-center text-slate-500">
                            No hay datos para este periodo.
                          </td>
                        </tr>
                      ) : (
                        agenda.motivos.top.map((m, idx) => (
                          <tr key={`${m.motivo}-${idx}`} className="border-t">
                            <Td>{m.motivo}</Td>
                            <Td>{m.total}</Td>
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

        {/* ✅ NUEVO: Recurrentes */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-sky-600" />
            Recurrentes
          </h2>

          {!agenda ? (
            <p className="text-sm text-slate-500">No hay datos disponibles.</p>
          ) : (
            <>
              {/* ✅ NUEVO: Citas por raza */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-800">
                    Citas por raza (Top 10)
                  </h3>
                  <span className="text-xs text-slate-500">No canceladas</span>
                </div>

                {dataPorRaza.length === 0 ? (
                  <p className="text-xs text-slate-500">No hay datos de raza para este periodo.</p>
                ) : (
                  <div className="w-full h-64">
                    <ResponsiveContainer>
                      <BarChart data={dataPorRaza}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="razaCorta" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="total" name="Citas" fill="#0ea5e9" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* ✅ NUEVO: Tabla por raza */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-4 py-2 border-b bg-slate-50 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-800">
                    Citas por raza (detalle)
                  </h3>
                  <span className="text-xs text-slate-500">Top 10</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <Th>Raza</Th>
                        <Th>Citas</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {(agenda.por_raza || []).length === 0 ? (
                        <tr>
                          <td colSpan={2} className="px-4 py-3 text-center text-slate-500">
                            No hay datos para este periodo.
                          </td>
                        </tr>
                      ) : (
                        agenda.por_raza.map((r, idx) => (
                          <tr key={`${r.raza}-${idx}`} className="border-t">
                            <Td>{r.raza || "Sin raza"}</Td>
                            <Td>{r.total ?? 0}</Td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Top Mascotas */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-4 py-2 border-b bg-slate-50 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-800">
                    Mascotas con más citas (Top 10)
                  </h3>
                  <span className="text-xs text-slate-500">No canceladas</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <Th>Mascota</Th>
                        <Th>Especie</Th>
                        <Th>Total citas</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {(agenda.top_mascotas || []).length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-4 py-3 text-center text-slate-500">
                            No hay datos.
                          </td>
                        </tr>
                      ) : (
                        agenda.top_mascotas.map((m) => (
                          <tr key={m.id} className="border-t">
                            <Td>{m.nombre}</Td>
                            <Td>{m.especie}</Td>
                            <Td>{m.total_citas}</Td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Top Clientes */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-4 py-2 border-b bg-slate-50 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-800">
                    Clientes con más citas (Top 10)
                  </h3>
                  <span className="text-xs text-slate-500">No canceladas</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <Th>Cliente</Th>
                        <Th>Email</Th>
                        <Th>Total citas</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {(agenda.top_clientes || []).length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-4 py-3 text-center text-slate-500">
                            No hay datos.
                          </td>
                        </tr>
                      ) : (
                        agenda.top_clientes.map((c) => (
                          <tr key={c.id} className="border-t">
                            <Td>{c.nombre}</Td>
                            <Td>{c.email}</Td>
                            <Td>{c.total_citas}</Td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* (Opcional) gráfico top mascotas */}
              {dataTopMascotas.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-800">
                      Mascotas recurrentes (gráfico)
                    </h3>
                    <span className="text-xs text-slate-500">Top 10</span>
                  </div>
                  <div className="w-full h-64">
                    <ResponsiveContainer>
                      <BarChart data={dataTopMascotas}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="nombreCorto" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="total_citas" name="Citas" fill="#0ea5e9" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* (Opcional) gráfico top clientes */}
              {dataTopClientes.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-800">
                      Clientes recurrentes (gráfico)
                    </h3>
                    <span className="text-xs text-slate-500">Top 10</span>
                  </div>
                  <div className="w-full h-64">
                    <ResponsiveContainer>
                      <BarChart data={dataTopClientes}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="nombreCorto" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="total_citas" name="Citas" fill="#22c55e" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
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
                  value={inventario.resumen?.total_productos}
                  accent="bg-sky-100 text-sky-700"
                />
                <ResumenCard
                  label="Con stock"
                  value={inventario.resumen?.con_stock}
                  accent="bg-emerald-100 text-emerald-700"
                />
                <ResumenCard
                  label="Sin stock"
                  value={inventario.resumen?.sin_stock}
                  accent="bg-slate-100 text-slate-700"
                />
                <ResumenCard
                  label="Bajo stock"
                  value={inventario.resumen?.bajo_stock}
                  accent="bg-amber-100 text-amber-700"
                />
                <ResumenCard
                  label="Próx. a vencer"
                  value={inventario.resumen?.proximos_a_vencer}
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
                        <Bar dataKey="stock" name="Stock actual" fill="#0ea5e9" />
                        <Bar dataKey="stock_minimo" name="Stock mínimo" fill="#64748b" />
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
                      {(inventario.criticos || []).length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-3 text-center text-slate-500">
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
                      {(inventario.proximos_a_vencer || []).length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-3 text-center text-slate-500">
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
                                ? dayjs(p.fecha_vencimiento).format("DD-MM-YYYY")
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
