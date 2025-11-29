import { useState } from "react";
import LayoutVet from "../../components/layout/LayoutVet";
import { Calendar, Plus, MessageSquareHeart } from "lucide-react";
import ModalAgregarRegistro from "../../components/modals/ModalAgregarRegistro";

export default function VetFichaClinica() {
  const [openModal, setOpenModal] = useState(false);

  // MOCK TIMELINE (cuando haya backend, se reemplaza)
  const registros = [
    {
      fecha: "20 Feb 2025",
      diagnostico: "Dermatitis alérgica",
      evolucion: "Paciente estable, sin picazón notable.",
    },
    {
      fecha: "03 Ene 2025",
      diagnostico: "Control general",
      evolucion: "Sin hallazgos relevantes.",
    },
  ];

  return (
    <LayoutVet>
      <div className="space-y-8">

        {/* Encabezado */}
        <section className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.25em] text-sky-600 uppercase mb-1">
              Vetyon · Ficha clínica
            </p>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
              Ficha clínica de Luna
            </h1>
            <p className="text-sm text-slate-600">
              Aquí podrás ver el historial clínico de la mascota.
            </p>
          </div>

          <button
            onClick={() => setOpenModal(true)}
            className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md transition"
          >
            <Plus className="h-5 w-5" />
            Nuevo registro
          </button>
        </section>

        {/* Información de la mascota */}
        <section className="bg-white rounded-3xl p-6 border border-slate-200 shadow-[0_8px_25px_rgba(15,23,42,0.06)]">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <MessageSquareHeart className="h-7 w-7" />
            </div>

            <div>
              <h2 className="font-bold text-lg text-slate-900">Luna</h2>
              <p className="text-sm text-slate-600">Gata · 3 años · Esterilizada</p>
              <p className="text-sm text-slate-600">Dueño: Juan Pérez</p>
            </div>
          </div>
        </section>

        {/* Timeline Premium */}
        <section className="bg-white rounded-3xl p-6 border border-slate-200 shadow-[0_8px_25px_rgba(15,23,42,0.06)] space-y-8">
          <h3 className="text-xl font-semibold text-slate-900">Historial clínico</h3>

          <div className="relative border-l-2 border-sky-200 ml-4 space-y-10">
            {registros.map((item, i) => (
              <div key={i} className="relative pl-8">
                {/* Punto del timeline */}
                <div className="absolute -left-[10px] top-1 h-4 w-4 rounded-full bg-sky-600 shadow shadow-sky-600/30" />

                <div className="bg-slate-50 hover:bg-white transition rounded-2xl p-5 border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-2 text-sky-700 font-semibold">
                    <Calendar className="h-4 w-4" />
                    {item.fecha}
                  </div>

                  <p className="font-semibold text-slate-900 mt-2">
                    Diagnóstico:
                  </p>
                  <p className="text-slate-700">{item.diagnostico}</p>

                  <p className="font-semibold text-slate-900 mt-3">
                    Evolución:
                  </p>
                  <p className="text-slate-700">{item.evolucion}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Modal */}
      <ModalAgregarRegistro
        open={openModal}
        onClose={() => setOpenModal(false)}
        onSave={() => setOpenModal(false)}
      />
    </LayoutVet>
  );
}
