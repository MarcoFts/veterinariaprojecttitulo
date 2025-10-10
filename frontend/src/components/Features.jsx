const feats = [
  {
    title: 'Agenda de citas inteligente',
    desc: 'Gestiona citas en línea, confirma automáticamente y envía recordatorios por WhatsApp o correo electrónico para reducir ausencias.',
  },
  {
    title: 'Fichas e historial clínico digital',
    desc: 'Registra diagnósticos, tratamientos, vacunas y archivos adjuntos. Mantén el historial médico completo de cada mascota disponible en todo momento.',
  },
  {
    title: 'Gestión de inventario y productos',
    desc: 'Controla medicamentos, alimentos y suministros. Recibe alertas por bajo stock o vencimiento y actualiza automáticamente cada movimiento.',
  },
  {
    title: 'Reportes e indicadores clave',
    desc: 'Visualiza métricas sobre citas, servicios más solicitados, rendimiento del personal y desempeño general de la clínica.',
  },
]

export default function Features() {
  return (
    <section id="funciones" className="py-16 md:py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="font-display text-3xl md:text-4xl font-extrabold text-center">
          Todo lo que necesitas <span className="text-roseA">para tu clínica veterinaria</span>
        </h2>
        <p className="text-center text-black/70 mt-2">
          VetCare integra todas las herramientas que tu clínica necesita en una sola plataforma digital.
        </p>

        <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {feats.map((f, i) => (
            <div
              key={i}
              className="rounded-2xl border bg-white p-6 hover:shadow-soft transition-shadow"
            >
              <div className="w-10 h-10 rounded-xl bg-roseC grid place-items-center text-roseA font-bold mb-3">
                {i + 1}
              </div>
              <h3 className="font-semibold text-lg">{f.title}</h3>
              <p className="text-sm text-black/70 mt-1">{f.desc}</p>
              <a
                href="#"
                className="inline-block mt-3 text-roseA font-semibold text-sm"
              >
                Ver más →
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
