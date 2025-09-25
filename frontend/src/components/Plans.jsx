import { useState } from 'react'

const tiers = [
  {
    name: 'Starter',
    mPrice: 0,
    yPrice: 0,
    features: [
      'Agenda básica',
      'Hasta 1 profesional',
      'Fichas clínicas ilimitadas',
      'Soporte por email'
    ],
    cta: 'Empezar gratis',
    highlight: false,
  },
  {
    name: 'Pro',
    mPrice: 19,
    yPrice: 190,
    features: [
      'Agenda avanzada + recordatorios',
      'Hasta 5 profesionales',
      'Inventario + alertas de vencimiento',
      'Reportes esenciales'
    ],
    cta: 'Probar Pro',
    highlight: true,
  },
  {
    name: 'Business',
    mPrice: 39,
    yPrice: 390,
    features: [
      'Usuarios ilimitados',
      'Flujos personalizados',
      'Reportes avanzados',
      'Soporte prioritario'
    ],
    cta: 'Hablar con ventas',
    highlight: false,
  },
]

export default function Plans() {
  const [annual, setAnnual] = useState(true)

  return (
    <section id="planes" className="py-16 md:py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="font-display text-3xl md:text-4xl font-extrabold">
              Planes simples <span className="text-roseA">para crecer</span>
            </h2>
            <p className="text-black/70 mt-1">Elige mensual o anual (2 meses gratis al año).</p>
          </div>

          {/* Toggle */}
          <div className="inline-flex items-center gap-2 p-1 rounded-full border">
            <button
              className={`px-4 py-2 rounded-full ${!annual ? 'bg-roseC text-roseA' : ''}`}
              onClick={()=>setAnnual(false)}
            >Mensual</button>
            <button
              className={`px-4 py-2 rounded-full ${annual ? 'bg-roseA text-white' : ''}`}
              onClick={()=>setAnnual(true)}
            >Anual</button>
          </div>
        </div>

        <div className="mt-10 grid md:grid-cols-3 gap-6">
          {tiers.map((t,i)=>(
            <div key={i} className={`rounded-2xl border p-6 ${t.highlight ? 'shadow-soft border-roseA/30' : ''}`}>
              <h3 className="font-semibold text-lg">{t.name}</h3>
              <div className="mt-3">
                {annual ? (
                  <p className="text-3xl font-extrabold"><span className="text-roseA">${t.yPrice}</span> <span className="text-sm text-black/60">/año</span></p>
                ) : (
                  <p className="text-3xl font-extrabold"><span className="text-roseA">${t.mPrice}</span> <span className="text-sm text-black/60">/mes</span></p>
                )}
              </div>
              <ul className="mt-4 space-y-2 text-sm text-black/80">
                {t.features.map((f,idx)=><li key={idx}>• {f}</li>)}
              </ul>
              <a href="#" className={`mt-6 inline-block px-5 py-2.5 rounded-full ${t.highlight ? 'bg-gradient-to-r from-roseA to-roseB text-white shadow-soft' : 'border hover:border-roseA/50'}`}>
                {t.cta}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
