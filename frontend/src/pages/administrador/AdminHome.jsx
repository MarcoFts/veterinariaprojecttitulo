import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Package,
  Users,
  UserCog,
  Stethoscope,
  ShieldCheck,
  AlertTriangle,
  Clock,
  ArrowLeftRight,
  RefreshCw,
  Plus,
} from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/es";
dayjs.locale("es");

import { getAdminDashboard } from "../../services/api";

function Card({ title, value, subtitle, Icon }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-wide text-slate-500">{title}</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
          {subtitle ? <p className="mt-1 text-xs text-slate-600">{subtitle}</p> : null}
        </div>
        {Icon ? (
          <div className="h-10 w-10 rounded-2xl bg-slate-900/5 flex items-center justify-center">
            <Icon className="h-5 w-5 text-slate-700" />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function BadgeTipo({ tipo }) {
  const isIngreso = tipo === "ingreso";
  return (
    <span
      className={`rounded-full px-2 py-1 text-xs font-semibold ${
        isIngreso ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
      }`}
    >
      {isIngreso ? "Ingreso" : "Salida"}
    </span>
  );
}

export default function AdminHome() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const cargar = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getAdminDashboard();
      setData(res?.data || null);
    } catch (e) {
      console.error(e);
      setError("No se pudo cargar el dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const kpis = data?.kpis || {};
  const inv = data?.inventario || {};
  const invList = inv?.listas || {};
  const agenda = data?.agenda || {};
  const movs = data?.movimientos_recientes || [];

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-widest text-slate-500">
            VETYON · PANEL ADMINISTRADOR
          </p>
          <h1 className="mt-1 text-3xl font-black text-slate-900">Control del sistema</h1>
          <p className="mt-1 text-sm text-slate-600">
            Supervisión rápida de inventario, agenda y actividad del sistema.
          </p>
          {data?.hoy ? (
            <p className="mt-1 text-xs text-slate-500">
              Fecha: {dayjs(data.hoy).format("dddd DD [de] MMMM, YYYY")}
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={cargar}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </button>

          <Link
            to="/admin/inventario"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            <Package className="h-4 w-4" />
            Gestionar inventario
          </Link>
        </div>
      </div>

      {/* ESTADOS */}
      {loading && <p className="text-sm text-slate-500">Cargando dashboard...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && data && (
        <>
          {/* KPIs INVENTARIO */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card
              title="PRODUCTOS REGISTRADOS"
              value={inv.total_productos ?? 0}
              subtitle="Inventario total del sistema"
              Icon={Package}
            />
            <Card
              title="STOCK BAJO"
              value={inv.bajo_stock ?? 0}
              subtitle="Requiere reposición"
              Icon={AlertTriangle}
            />
            <Card
              title="PRÓXIMOS A VENCER"
              value={inv.por_vencer ?? 0}
              subtitle="Ventana de 30 días"
              Icon={Clock}
            />
          </div>

          {/* KPIs USUARIOS */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card title="USUARIOS" value={kpis.usuarios ?? 0} subtitle="Total en el sistema" Icon={Users} />
            <Card title="CLIENTES" value={kpis.clientes ?? 0} subtitle="Con ficha de cliente" Icon={Users} />
            <Card title="VETERINARIOS" value={kpis.veterinarios ?? 0} subtitle="Grupo veterinarios" Icon={Stethoscope} />
            <Card title="ADMINS" value={kpis.admins ?? 0} subtitle="Staff / superuser" Icon={ShieldCheck} />
          </div>

          {/* ACCIONES RÁPIDAS */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-bold text-slate-900">Acciones rápidas</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <Link
                to="/admin/inventario"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                <Package className="h-4 w-4" />
                Inventario
              </Link>

              <Link
                to="/admin/movimientos"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                <ArrowLeftRight className="h-4 w-4" />
                Movimientos
              </Link>

              <Link
                to="/admin/motivos"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                <Plus className="h-4 w-4" />
                Motivos
              </Link>

              {/* cuando implementemos usuarios */}
              <button
                disabled
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-400 cursor-not-allowed"
                title="Lo hacemos en el siguiente paso"
              >
                <UserCog className="h-4 w-4" />
                Usuarios (pronto)
              </button>
            </div>
          </div>

          {/* 2 COLUMNAS: ALERTAS + MOVIMIENTOS */}
          <div className="grid gap-4 lg:grid-cols-2">
            {/* ALERTAS */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-slate-900">Alertas del sistema</p>
                <Link to="/admin/inventario" className="text-xs font-semibold text-slate-600 hover:text-slate-900">
                  Ver inventario →
                </Link>
              </div>

              <div className="mt-4 space-y-4">
                {/* SIN STOCK */}
                <div>
                  <p className="text-xs font-bold text-slate-700">Sin stock ({inv.sin_stock ?? 0})</p>
                  {invList.sin_stock?.length ? (
                    <ul className="mt-2 space-y-2">
                      {invList.sin_stock.map((p) => (
                        <li key={p.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{p.nombre}</p>
                            <p className="text-xs text-slate-500">{p.categoria}</p>
                          </div>
                          <span className="text-xs font-bold text-rose-700">0</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-slate-500">No hay productos sin stock.</p>
                  )}
                </div>

                {/* STOCK BAJO */}
                <div>
                  <p className="text-xs font-bold text-slate-700">Stock bajo ({inv.bajo_stock ?? 0})</p>
                  {invList.stock_bajo?.length ? (
                    <ul className="mt-2 space-y-2">
                      {invList.stock_bajo.map((p) => (
                        <li key={p.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{p.nombre}</p>
                            <p className="text-xs text-slate-500">
                              Stock mín: {p.stock_minimo} · {p.categoria}
                            </p>
                          </div>
                          <span className="text-xs font-bold text-amber-700">{p.stock}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-slate-500">No hay productos con stock bajo.</p>
                  )}
                </div>

                {/* POR VENCER */}
                <div>
                  <p className="text-xs font-bold text-slate-700">Por vencer ({inv.por_vencer ?? 0})</p>
                  {invList.por_vencer?.length ? (
                    <ul className="mt-2 space-y-2">
                      {invList.por_vencer.map((p) => (
                        <li key={p.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{p.nombre}</p>
                            <p className="text-xs text-slate-500">{p.categoria}</p>
                          </div>
                          <span className="text-xs font-bold text-slate-700">
                            {p.fecha_vencimiento ? dayjs(p.fecha_vencimiento).format("DD/MM/YYYY") : "-"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-slate-500">No hay productos próximos a vencer.</p>
                  )}
                </div>
              </div>
            </div>

            {/* MOVIMIENTOS + AGENDA */}
            <div className="space-y-4">
              {/* AGENDA */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-sm font-bold text-slate-900">Resumen de agenda</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-slate-50 px-3 py-2">
                    <p className="text-xs font-semibold text-slate-500">Citas hoy</p>
                    <p className="text-xl font-black text-slate-900">{agenda.citas_hoy ?? 0}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 px-3 py-2">
                    <p className="text-xs font-semibold text-slate-500">Pendientes hoy</p>
                    <p className="text-xl font-black text-slate-900">{agenda.pendientes_hoy ?? 0}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 px-3 py-2">
                    <p className="text-xs font-semibold text-slate-500">Confirmadas hoy</p>
                    <p className="text-xl font-black text-slate-900">{agenda.confirmadas_hoy ?? 0}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 px-3 py-2">
                    <p className="text-xs font-semibold text-slate-500">No asistidas (30 días)</p>
                    <p className="text-xl font-black text-slate-900">{agenda.no_asistidas_30d ?? 0}</p>
                  </div>
                </div>
              </div>

              {/* MOVIMIENTOS */}
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="flex items-center justify-between p-4">
                  <p className="text-sm font-bold text-slate-900">Últimos movimientos</p>
                  <Link to="/admin/movimientos" className="text-xs font-semibold text-slate-600 hover:text-slate-900">
                    Ver todos →
                  </Link>
                </div>

                {movs.length === 0 ? (
                  <div className="px-4 pb-4 text-sm text-slate-500">No hay movimientos recientes.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-slate-50 border-t border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-slate-700">Fecha</th>
                          <th className="px-4 py-3 text-left font-semibold text-slate-700">Producto</th>
                          <th className="px-4 py-3 text-left font-semibold text-slate-700">Tipo</th>
                          <th className="px-4 py-3 text-left font-semibold text-slate-700">Cant.</th>
                        </tr>
                      </thead>
                      <tbody>
                        {movs.map((m) => (
                          <tr key={m.id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="px-4 py-3 text-slate-700">
                              {m.fecha ? dayjs(m.fecha).format("DD/MM HH:mm") : "-"}
                            </td>
                            <td className="px-4 py-3 font-semibold text-slate-900">
                              {m.producto_nombre || `#${m.producto_id}`}
                              {m.producto_codigo ? (
                                <div className="text-xs text-slate-500">Código: {m.producto_codigo}</div>
                              ) : null}
                            </td>
                            <td className="px-4 py-3">
                              <BadgeTipo tipo={m.tipo} />
                            </td>
                            <td className="px-4 py-3 font-bold text-slate-900">{m.cantidad}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
