export default function Logos() {
    const items = ['Bivett','Aquavet','Evi','SanLucas','Maskotikan']
    return (
      <section className="py-10">
        <div className="max-w-6xl mx-auto px-4">
          <p className="text-center text-black/60 text-sm mb-4">
            Con la confianza de clínicas en más de 20 países
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 opacity-70">
            {items.map((x,i)=>(
              <div key={i} className="h-8 w-28 rounded bg-black/5 grid place-items-center text-xs">{x}</div>
            ))}
          </div>
        </div>
      </section>
    )
  }
  