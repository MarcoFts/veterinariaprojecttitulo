export default function Hero() {
    return (
      <section className="relative overflow-hidden">
        {/* fondo */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white to-roseC/40" />
  
        <div className="max-w-6xl mx-auto px-4 py-20 md:py-28 grid md:grid-cols-2 items-center gap-10">
          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-roseC text-roseA font-semibold text-xs mb-4">
              Software Veterinario
            </span>
            <h1 className="font-display text-4xl md:text-6xl font-extrabold leading-tight">
              Gestión <span className="text-roseA">integral</span><br /> para tu veterinaria
            </h1>
            <p className="mt-4 text-lg text-black/70">
              Simplifica y optimiza citas, fichas clínicas, inventario y comunicación con clientes desde un solo lugar.
            </p>
  
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a href="#" className="px-5 py-3 rounded-full bg-gradient-to-r from-roseA to-roseB text-white shadow-soft">
                Abrir cuenta GRATIS
              </a>
              <a href="#funciones" className="px-5 py-3 rounded-full border border-roseA/30 hover:border-roseA">
                Ver funcionalidades
              </a>
            </div>
  
            <p className="mt-4 text-sm text-black/60">Con la confianza de clínicas en +20 países.</p>
          </div>
  
          <div className="relative">
            <div className="aspect-video rounded-[var(--radius)] bg-white shadow-xl border border-white overflow-hidden">
              {/* imagen/ilustración de relleno */}
              <div className="w-full h-full bg-gradient-to-br from-roseC via-white to-roseB/30 grid place-items-center">
                <span className="font-display text-3xl text-roseA">Demo</span>
              </div>
            </div>
  
            <div className="absolute -bottom-6 -left-6 hidden md:block">
              <div className="rounded-2xl bg-white p-4 shadow-xl border">
                <p className="text-sm font-semibold">Citas de hoy</p>
                <p className="text-roseA font-bold text-2xl">12</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }
  