const docs = [
    { n: 'Dra. Verónica Hoyos', e: 'Medicina Felina', f: '/equipo/doc1.jpg' },
    { n: 'Dr. Juan Pérez', e: 'Cirugía y Trauma', f: '/equipo/doc2.jpg' },
    { n: 'Dra. Camila Soto', e: 'Dermatología', f: '/equipo/doc3.jpg' },
  ]
  
  export default function Equipo() {
    return (
      <main className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="font-display text-4xl font-extrabold mb-8">Nuestro equipo</h1>
          <div className="grid md:grid-cols-3 gap-6">
            {docs.map((d,i)=>(
              <div key={i} className="rounded-2xl border bg-white p-4 text-center">
                <img src={d.f} alt={d.n} className="w-full aspect-[4/3] object-cover rounded-xl" />
                <h3 className="mt-3 font-semibold">{d.n}</h3>
                <p className="text-sm text-black/70">{d.e}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    )
  }
  