export default function Contacto() {
    return (
      <main className="py-16">
        <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-8">
          <div>
            <h1 className="font-display text-4xl font-extrabold mb-4">Contacto</h1>
            <p className="text-black/80">Av. Siempre Viva 123, Los Ángeles, Chile</p>
            <p className="text-black/80">Tel: +56 9 1234 5678 · correo@vetcare.cl</p>
            <div className="mt-6 rounded-2xl overflow-hidden border">
              <iframe
                title="Ubicación"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d..."
                className="w-full h-72"
                loading="lazy" />
            </div>
            <h2 className="mt-6 font-semibold">Horarios</h2>
            <ul className="text-sm text-black/70">
              <li>Lunes a Viernes: 09:00–19:00</li>
              <li>Sábado: 10:00–14:00</li>
              <li>Urgencias: +56 9 1234 5678</li>
            </ul>
          </div>
          <div className="rounded-2xl border bg-white p-6">
            <h3 className="font-semibold text-lg">Escríbenos</h3>
            <p className="text-sm text-black/70">Responderemos a la brevedad.</p>
            <a href="https://wa.me/56912345678" target="_blank" className="inline-block mt-4 px-5 py-3 rounded-full bg-green-500 text-white">WhatsApp</a>
          </div>
        </div>
      </main>
    )
  }
  