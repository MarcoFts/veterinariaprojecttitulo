import LayoutVet from "../../components/layout/LayoutVet";
import { BarChart3 } from "lucide-react";

export default function VetCitas() {
  return (
    <LayoutVet>
      <div className="space-y-6">
        <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <p className="text-xs font-semibold tracking-[0.25em] text-sky-600 uppercase mb-1">
              VetCare · Veterinario
            </p>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
              Citas y estadísticas
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              En esta sección verás el historial de reservas y un resumen de tu actividad.
            </p>
          </div>
        </section>

        <section className="rounded-3xl bg-white border border-slate-100 shadow-[0_8px_25px_rgba(15,23,42,0.06)] p-6 flex flex-col items-center justify-center text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-700 mb-3">
            <BarChart3 className="h-6 w-6" />
          </div>
          <h2 className="text-sm font-semibold text-slate-900 mb-1">
            Sin datos aún
          </h2>
          <p className="text-sm text-slate-600 max-w-md">
            Más adelante podrás visualizar gráficos con tus citas confirmadas,
            canceladas y atendidas, filtradas por rango de fechas.
          </p>
        </section>
      </div>
    </LayoutVet>
  );
}
