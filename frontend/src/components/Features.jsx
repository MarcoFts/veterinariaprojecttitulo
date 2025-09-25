const feats = [
    {
      title: 'Agenda inteligente',
      desc: 'Programa, confirma y envía recordatorios automáticos por WhatsApp/Email.',
    },
    {
      title: 'Fichas clínicas',
      desc: 'Historial completo, diagnósticos, tratamientos y adjuntos.',
    },
    {
      title: 'Inventario',
      desc: 'Control de stock, alertas por vencimiento y mínimos.',
    },
    {
      title: 'Reportes',
      desc: 'Indicadores clave para la toma de decisiones.',
    },
  ]
  
  export default function Features() {
    return (
      <section id="funciones" className="py-16 md:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="font-display text-3xl md:text-4xl font-extrabold text-center">
            Todo lo que necesitas <span className="text-roseA">en un lugar</span>
          </h2>
          <p className="text-center text-black/70 mt-2">Diseñado para el flujo real de tu clínica</p>
  
          <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {feats.map((f,i)=>(
              <div key={i} className="rounded-2xl border bg-white p-6 hover:shadow-soft transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-roseC grid place-items-center text-roseA font-bold mb-3">
                  {i+1}
                </div>
                <h3 className="font-semibold text-lg">{f.title}</h3>
                <p className="text-sm text-black/70 mt-1">{f.desc}</p>
                <a href="#" className="inline-block mt-3 text-roseA font-semibold text-sm">Ver más →</a>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }
  