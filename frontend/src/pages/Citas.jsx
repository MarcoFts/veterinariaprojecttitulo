import { useState } from 'react'
import { logout } from '../auth'
import { useNavigate } from 'react-router-dom'

export default function Citas() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    nombre: '', email: '', telefono: '',
    mascota: '', especie: 'Perro',
    fecha: '', hora: '', motivo: '',
  })
  const [status, setStatus] = useState(null)

  const onChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  const onSubmit = async (e) => {
    e.preventDefault()
    setStatus('enviando')
    try {
      const res = await fetch('http://127.0.0.1:8000/api/citas/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente_nombre: form.nombre,
          cliente_email: form.email,
          cliente_telefono: form.telefono,
          mascota_nombre: form.mascota,
          especie: form.especie,
          fecha: form.fecha,
          hora: form.hora,
          motivo: form.motivo
        })
      })
      if (!res.ok) throw new Error('Error al registrar la cita')
      setStatus('ok')
      setForm({ nombre:'', email:'', telefono:'', mascota:'', especie:'Perro', fecha:'', hora:'', motivo:'' })
    } catch (err) {
      setStatus('error')
    }
  }

  return (
    <main className="py-16">
      <header className="flex justify-end max-w-3xl mx-auto px-4">
        <button
          onClick={() => { logout(); navigate('/login') }}
          className="text-sm text-black/70 hover:text-roseA"
        >
          Cerrar sesión
        </button>
      </header>

      <div className="max-w-3xl mx-auto px-4">
        <h1 className="font-display text-4xl font-extrabold mb-6">Agenda tu cita</h1>
        <form onSubmit={onSubmit} className="rounded-2xl border bg-white p-6 grid md:grid-cols-2 gap-4">
          <input className="border rounded-xl p-3" placeholder="Tu nombre" name="nombre" value={form.nombre} onChange={onChange} required />
          <input className="border rounded-xl p-3" placeholder="Email" type="email" name="email" value={form.email} onChange={onChange} />
          <input className="border rounded-xl p-3" placeholder="Teléfono" name="telefono" value={form.telefono} onChange={onChange} required />
          <input className="border rounded-xl p-3" placeholder="Nombre de la mascota" name="mascota" value={form.mascota} onChange={onChange} required />
          <select className="border rounded-xl p-3" name="especie" value={form.especie} onChange={onChange}>
            <option>Perro</option><option>Gato</option><option>Exótico</option>
          </select>
          <input className="border rounded-xl p-3" type="date" name="fecha" value={form.fecha} onChange={onChange} required />
          <input className="border rounded-xl p-3" type="time" name="hora" value={form.hora} onChange={onChange} required />
          <textarea className="md:col-span-2 border rounded-xl p-3" name="motivo" value={form.motivo} onChange={onChange} placeholder="Motivo de la consulta" rows="3" />
          <button className="md:col-span-2 px-6 py-3 rounded-full bg-gradient-to-r from-roseA to-roseB text-white shadow-soft">Solicitar cita</button>
        </form>

        {status === 'ok' && <p className="mt-4 text-green-600">¡Listo! Te contactaremos para confirmar.</p>}
        {status === 'error' && <p className="mt-4 text-red-600">Hubo un problema, intenta nuevamente.</p>}
      </div>
    </main>
  )
}
