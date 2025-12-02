import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import LayoutCliente from "../../components/layout/LayoutCliente";
import {
  CalendarDays,
  PawPrint,
  BarChart3,
  Clock,
  AlertCircle,
} from "lucide-react";
import api from "../../services/api";

export default function ClienteHome() {
  const [mascotas, setMascotas] = useState([]);
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [mascotasRes, citasRes] = await Promise.all([
          api.get("/mascotas/"),
          api.get("/citas/"),
        ]);

        setMascotas(mascotasRes.data || []);
        setCitas(citasRes.data || []);
      } catch (e) {
        console.error("Error cargando datos del panel:", e);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Próxima cita
  const proximaCita =
    citas
      .filter((c) => c.estado !== "cancelada")
      .sort((a, b) => new Date(a.inicio) - new Date(b.inicio))[0] || null;

  return (
    <LayoutCliente>
      <div className="space-y-14 animate-fadeIn">

        {/* HERO SUPER PREMIUM */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-50 via-white to-blue-50 p-8 shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-white mb-4">
          {/* Glow decorativo */}
          <div className="absolute -top-10 -right-10 w-64 h-64 bg-sky-200/30 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-blue-200/30 rounded-full blur-3xl" />

          <div className="relative z-10 flex flex-col gap-6">
            <p className="text-xs font-semibold tracking-[0.25em] text-sky-600 uppercase">
              Vetyon · Panel del Cliente
            </p>

            <h1 className="text-4xl font-extrabold text-slate-900 leading-tight">
              Tu espacio <span className="text-sky-600">personal</span> en Vetyon
            </h1>

            <p className="text-base text-slate-600 leading-relaxed max-w-2xl">
              Administra tus mascotas, consulta tu historial, agenda nuevas atenciones
              y mantén el control total de su bienestar en un solo lugar.
            </p>
          </div>
        </section>

        {/* TARJETAS */}
        <section className="grid gap-8 md:grid-cols-3">

          {/* --- PRÓXIMA CITA --- */}
          <div className="group rounded-3xl bg-white shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-slate-100 p-7 hover:shadow-[0_10px_35px_rgba(0,0,0,0.10)] transition-all duration-300">
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 border border-sky-100 text-xs font-medium text-sky-700">
                <CalendarDays size={16} />
                <span>Próxima cita</span>
              </div>

              {loading ? (
                <p className="mt-4 text-slate-500 text-sm">Cargando…</p>
              ) : proximaCita ? (
                <div className="mt-5 space-y-2">
                  <p className="text-[15px] text-slate-700">
                    <span className="font-semibold">
                      {new Date(proximaCita.inicio).toLocaleDateString("es-CL")}
                    </span>
                  </p>
                  <p className="text-[14px] text-slate-600 flex items-center gap-2">
                    <Clock size={15} className="text-sky-500" />
                    {new Date(proximaCita.inicio).toLocaleTimeString("es-CL", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <p className="text-[14px] text-slate-500">
                    Mascota: <span className="font-medium">{proximaCita.mascota_nombre}</span>
                  </p>
                </div>
              ) : (
                <p className="mt-5 text-[15px] text-slate-600 leading-relaxed">
                  Aún no tienes ninguna cita agendada.
                </p>
              )}
            </div>

            <Link
              to="/cliente/citas"
              className="text-sm font-medium text-sky-600 hover:text-blue-700 transition"
            >
              Ver agenda →
            </Link>
          </div>

          {/* --- MIS MASCOTAS --- */}
          <div className="group rounded-3xl bg-white shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-slate-100 p-7 hover:shadow-[0_10px_35px_rgba(0,0,0,0.10)] transition-all duration-300">
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 border border-blue-100 text-xs font-medium text-blue-700">
                <PawPrint size={16} />
                <span>Mis mascotas</span>
              </div>

              <p className="mt-5 text-[15px] text-slate-600 leading-relaxed">
                {loading
                  ? "Cargando mascotas…"
                  : mascotas.length === 0
                  ? "Aún no tienes mascotas registradas."
                  : `Tienes ${mascotas.length} mascota(s) registradas.`}
              </p>
            </div>

            <Link
              to="/cliente/mis-mascotas"
              className="text-sm font-medium text-sky-600 hover:text-blue-700 transition"
            >
              Ver mis mascotas →
            </Link>
          </div>

          {/* --- RESUMEN RÁPIDO --- */}
          <div className="group rounded-3xl bg-white shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-slate-100 p-7 hover:shadow-[0_10px_35px_rgba(0,0,0,0.10)] transition-all duration-300">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1 border border-slate-200 text-xs font-medium text-slate-700">
                <BarChart3 size={16} />
                <span>Resumen rápido</span>
              </div>

              <ul className="mt-5 space-y-2 text-[15px] text-slate-700">
                <li className="flex items-center gap-2">• {loading ? "…" : citas.length} citas totales</li>
                <li className="flex items-center gap-2">• {loading ? "…" : mascotas.length} mascotas registradas</li>
                <li className="flex items-center gap-2">• 0 recordatorios pendientes</li>
              </ul>
            </div>
          </div>

        </section>

      </div>
    </LayoutCliente>
  );
}
