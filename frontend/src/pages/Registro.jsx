import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { setTokens } from '../auth'

export default function Registro() {
  const nav = useNavigate()
  const [f, setF] = useState({
    // Usuario
    full_name: '', email: '',
    password: '', password2: '',
    // Cliente
    telefono:'', rut_dni:'', direccion:'', acepta_comunicaciones:true,
    // Mascota
    nombre_mascota:'', especie:'Perro', raza:'', sexo:'Macho',
    fecha_nacimiento:'', peso_kg:'', esterilizado:false, microchip:'', notas_salud:''
  })
  const [msg, setMsg] = useState({ type: '', text: '' })
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)

  const onChange = e => {
    const { name, type, checked, value } = e.target
    setF(v => ({ ...v, [name]: type === 'checkbox' ? checked : value }))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setMsg({type:'', text:''})

    if (f.password !== f.password2) {
      return setMsg({ type: 'error', text: 'Las contraseñas no coinciden.' })
    }
    if (f.password.length < 8) {
      return setMsg({ type: 'error', text: 'La contraseña debe tener al menos 8 caracteres.' })
    }

    setLoading(true)
    try {
      const payload = {
        ...f,
        peso_kg: f.peso_kg ? Number(f.peso_kg) : null,
        fecha_nacimiento: f.fecha_nacimiento || null,
      }

      const res = await fetch('http://127.0.0.1:8000/api/auth/register/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json().catch(()=> ({}))
      if (!res.ok) {
        const firstError = typeof data === 'object' ? Object.values(data)?.[0]?.[0] : null
        throw new Error(firstError || 'No se pudo registrar')
      }

      // si tu backend devuelve tokens, guárdalos para entrar de inmediato
      if (data?.tokens?.access && data?.tokens?.refresh) {
        setTokens(data.tokens)
      }

      setMsg({ type: 'ok', text: '¡Cuenta creada!' })
      nav('/login') // o nav('/citas') si quieres entrar directo
    } catch (err) {
      setMsg({ type: 'error', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="py-16">
      <div className="max-w-5xl mx-auto px-4 grid md:grid-cols-2 gap-8">
        {/* Lado visual */}
        <div className="rounded-2xl overflow-hidden bg-[url('/hero/registro.jpg')] bg-cover bg-center min-h-[440px] relative">
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute bottom-6 left-6 right-6 text-white">
            <h1 className="font-display text-3xl md:text-4xl font-extrabold">Regístrate</h1>
            <p className="text-white/90">Crea tu ficha y la de tu mascota para agendar más rápido.</p>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={onSubmit} className="rounded-2xl border bg-white p-6 space-y-5">
          <div>
            <h2 className="font-semibold text-lg">Tus datos</h2>
            <div className="grid md:grid-cols-2 gap-3 mt-2">
              <input className="border rounded-xl p-3" name="full_name" placeholder="Nombre completo" value={f.full_name} onChange={onChange} required />
              <input className="border rounded-xl p-3" type="email" name="email" placeholder="Email" value={f.email} onChange={onChange} required />
              <input className="border rounded-xl p-3" name="telefono" placeholder="Teléfono" value={f.telefono} onChange={onChange} />
              <input className="border rounded-xl p-3" name="rut_dni" placeholder="RUT / DNI (opcional)" value={f.rut_dni} onChange={onChange} />
              <input className="md:col-span-2 border rounded-xl p-3" name="direccion" placeholder="Dirección (opcional)" value={f.direccion} onChange={onChange} />

              {/* Contraseña */}
              <div className="relative">
                <input
                  className="border rounded-xl p-3 w-full" name="password"
                  type={showPwd ? 'text' : 'password'} placeholder="Contraseña (mín. 8)"
                  value={f.password} onChange={onChange} required autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowPwd(v=>!v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-sm underline">
                  {showPwd ? 'Ocultar' : 'Ver'}
                </button>
              </div>
              <input className="border rounded-xl p-3" name="password2" type="password"
                     placeholder="Confirmar contraseña" value={f.password2} onChange={onChange} required />

              <label className="md:col-span-2 flex items-center gap-2 text-sm">
                <input type="checkbox" name="acepta_comunicaciones" checked={f.acepta_comunicaciones} onChange={onChange} />
                Acepto recibir recordatorios y comunicaciones.
              </label>
            </div>
          </div>

          <div>
            <h2 className="font-semibold text-lg">Datos de la mascota</h2>
            <div className="grid md:grid-cols-2 gap-3 mt-2">
              <input className="border rounded-xl p-3" name="nombre_mascota" placeholder="Nombre de la mascota" value={f.nombre_mascota} onChange={onChange} required />
              <select className="border rounded-xl p-3" name="especie" value={f.especie} onChange={onChange}>
                <option>Perro</option><option>Gato</option><option>Otro</option>
              </select>
              <input className="border rounded-xl p-3" name="raza" placeholder="Raza (opcional)" value={f.raza} onChange={onChange} />
              <select className="border rounded-xl p-3" name="sexo" value={f.sexo} onChange={onChange}>
                <option>Macho</option><option>Hembra</option><option>No informado</option>
              </select>
              <input className="border rounded-xl p-3" type="date" name="fecha_nacimiento" value={f.fecha_nacimiento} onChange={onChange} />
              <input className="border rounded-xl p-3" type="number" step="0.01" name="peso_kg" placeholder="Peso (kg)" value={f.peso_kg} onChange={onChange} />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="esterilizado" checked={f.esterilizado} onChange={onChange} />
                Esterilizado
              </label>
              <input className="border rounded-xl p-3" name="microchip" placeholder="Microchip (opcional)" value={f.microchip} onChange={onChange} />
              <textarea className="md:col-span-2 border rounded-xl p-3" name="notas_salud" rows="3" placeholder="Notas de salud" value={f.notas_salud} onChange={onChange} />
            </div>
          </div>

          <button disabled={loading} className="w-full px-6 py-3 rounded-full bg-gradient-to-r from-roseA to-roseB text-white shadow-soft">
            {loading ? 'Registrando…' : 'Registrar'}
          </button>

          {msg.type==='ok' && <p className="text-green-600 text-sm">{msg.text}</p>}
          {msg.type==='error' && <p className="text-red-600 text-sm">{msg.text}</p>}
        </form>
      </div>
    </main>
  )
}
