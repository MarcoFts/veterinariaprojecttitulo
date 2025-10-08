import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { setTokens } from '../auth'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErr('')

    try {
      const res = await fetch('http://127.0.0.1:8000/api/auth/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }) // <-- EMAIL, no username
      })

      let data = {}
      try { data = await res.json() } catch {}

      const pickError = (d) =>
        d?.detail || d?.email?.[0] || d?.password?.[0] || d?.non_field_errors?.[0] || 'Credenciales inválidas'

      if (!res.ok) {
        console.error('Login error →', data)
        throw new Error(pickError(data))
      }

      // éxito: { access, refresh }
      setTokens(data)
      navigate('/citas')
    } catch (e) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-[80vh] grid md:grid-cols-2">
      <section className="p-10 max-w-lg w-full mx-auto">
        <h1 className="font-display text-3xl font-extrabold mb-6">Iniciar sesión</h1>
        <form onSubmit={submit} className="space-y-4">
          <input
            className="w-full border rounded-xl p-3"
            type="email"
            placeholder="Email"
            value={email}
            onChange={e=>setEmail(e.target.value)}
            required
          />
          <input
            className="w-full border rounded-xl p-3"
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={e=>setPassword(e.target.value)}
            required
          />
          <button
            disabled={loading}
            className="w-full px-6 py-3 rounded-full bg-gradient-to-r from-roseA to-roseB text-white shadow-soft"
          >
            {loading ? 'Ingresando…' : 'Iniciar sesión'}
          </button>
          {err && <p className="text-red-600 text-sm">{err}</p>}
          <p className="text-sm text-black/70">
            ¿No tienes cuenta?
            <a href="/#/registro" className="text-roseA ml-1">Regístrate</a>
          </p>
        </form>
      </section>

      <section className="hidden md:block bg-[url('/hero/login.jpg')] bg-cover bg-center relative">
        <div className="absolute inset-0 bg-black/35"/>
        <div className="absolute bottom-8 left-8 right-8 text-white">
          <h2 className="text-4xl font-extrabold">El mejor cuidado para tu mascota</h2>
          <p className="text-white/90 mt-2">Agenda, historial y recordatorios en un solo lugar.</p>
        </div>
      </section>
    </main>
  )
}
