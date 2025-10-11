import { Link } from "react-router-dom";

const servicios = [
  { t: "Consulta General", d: "Evaluación completa y plan de cuidados." },
  { t: "Vacunación y Control", d: "Calendario preventivo para perros y gatos." },
  { t: "Urgencias", d: "Atención prioritaria. Llámanos antes de venir." },
  { t: "Cirugía menor", d: "Esterilización y procedimientos ambulatorios." },
  { t: "Desparasitación", d: "Interna y externa, según peso y especie." },
  { t: "Estética", d: "Baño, corte y limpieza de oídos." },
];

export default function Servicios() {
  return (
    <main className="py-16">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="font-display text-4xl font-extrabold mb-8">Nuestros servicios</h1>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {servicios.map((s, i) => (
            <div key={i} className="rounded-2xl border p-6 hover:shadow-soft transition-shadow bg-white">
              <div className="w-10 h-10 rounded-xl bg-roseC grid place-items-center text-roseA font-bold mb-3">{i + 1}</div>
              <h3 className="font-semibold text-lg">{s.t}</h3>
              <p className="text-sm text-black/70 mt-1">{s.d}</p>
              <Link to="/citas" className="inline-block mt-3 text-roseA font-semibold text-sm">
                Agendar →
              </Link>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
