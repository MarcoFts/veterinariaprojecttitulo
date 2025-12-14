import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Package,
  AlertTriangle,
  ShieldCheck,
  Clock,
} from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/es";

import { getProductos } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

dayjs.locale("es");

export default function AdminHome() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [productos, setProductos] = useState([]);

  const cargarDatos = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await getProductos();
      setProductos(res?.data || []);
    } catch (e) {
      console.error("Error cargando panel admin:", e);
      setError("No se pudieron cargar los datos del panel.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) cargarDatos();
  }, [user]);

  const { totalProductos, stockBajo, proximosVencer } = useMemo(() => {
    const hoy = dayjs();
    const en30Dias = hoy.add(30, "day");

    const bajo = productos.filter(
      (p) => p.stock <= p.stock_minimo
    ).length;

    const vencer = productos.filter((p) => {
      if (!p.fecha_vencimiento) return false;
      const fv = dayjs(p.fecha_vencimiento);
      return fv.isAfter(hoy) && fv.isBefore(en30Dias);
    }).length;

    return {
      totalProductos: productos.length,
      stockBajo: bajo,
      proximosVencer: vencer,
    };
  }, [productos]);

  const kpis = [
    {
      label: "Productos registrados",
      value: loading ? "—" : totalProductos,
      icon: Package,
      hint: "Inventario total del sistema",
    },
    {
      label: "Stock bajo",
      value: loading ? "—" : stockBajo,
      icon: AlertTriangle,
      hint: "Requiere reposición",
    },
    {
      label: "Próximos a vencer",
      value: loading ? "—" : proximosVencer,
      icon: Clock,
      hint: "Próximos 30 días",
    },
  ];

  return (
    <div className="space-y-10 md:space-y-12">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-50 via-white to-slate-100 border border-white shadow-[0_18px_55px_rgba(15,23,42,0.10)] px-6 py-6 md:px-8 md:py-7">
        <div className="pointer-events-none absolute -top-16 -right-10 h-40 w-40 rounded-full bg-slate-300/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-16 h-48 w-48 rounded-full bg-slate-400/20 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <p className="text-xs font-semibold tracking-[0.25em] text-slate-500 uppercase mb-2">
              Vetyon · Panel Administrador
            </p>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900">
              Control del sistema
            </h1>
            <p className="mt-2 text-sm md:text-base text-slate-600">
              Supervisa inventario y estados críticos del sistema.
            </p>

            {error && (
              <p className="mt-3 text-xs text-red-600">{error}</p>
            )}
          </div>

          <div className="flex flex-col gap-3 md:items-end">
            <Link
              to="/admin/inventario"
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-xs md:text-sm font-semibold text-white shadow-md hover:opacity-90 transition"
            >
              Gestionar inventario
            </Link>

            <div className="rounded-2xl bg-white/70 border border-slate-100 px-4 py-2 shadow-sm backdrop-blur-md flex items-center gap-2 text-[11px] text-slate-600">
              <ShieldCheck className="h-4 w-4 text-slate-700" />
              Acceso administrativo activo
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-6 grid gap-3 md:grid-cols-3">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <div
                key={kpi.label}
                className="rounded-2xl bg-white/80 border border-slate-100 px-4 py-3 shadow-sm flex items-center justify-between"
              >
                <div>
                  <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
                    {kpi.label}
                  </p>
                  <p className="text-lg font-semibold text-slate-900">
                    {kpi.value}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {kpi.hint}
                  </p>
                </div>
                <Icon className="h-5 w-5 text-slate-400" />
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
