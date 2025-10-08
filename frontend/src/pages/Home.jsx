import Hero from '../components/Hero'
import Logos from '../components/Logos'
import Features from '../components/Features'
import CTA from '../components/CTA'

export default function Home() {
  return (
    <>
      <Hero />
      <Logos />
      <section className="py-8">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="font-display text-3xl md:text-4xl font-extrabold text-center">
            ¿Por qué elegir <span className="text-roseA">VetCare</span>?
          </h2>
          <p className="text-center text-black/70 mt-2">
            Atención cercana, profesionales certificados y enfoque preventivo.
          </p>
        </div>
      </section>
      <Features />
      <CTA />
    </>
  )
}
