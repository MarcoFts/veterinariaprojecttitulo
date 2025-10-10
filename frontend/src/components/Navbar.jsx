import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getToken, logout } from '../auth'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const isLogged = !!getToken()
  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-50 backdrop-blur bg-white/70 border-b border-white/40">
      <nav className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-roseA to-roseB shadow-soft grid place-items-center text-white font-bold">V</div>
          <span className="font-display text-xl font-extrabold">
            Vet<strong className="text-roseA">Care</strong>
          </span>
        </a>

        {/* Menú principal */}
        <ul className="hidden md:flex items-center gap-6 text-sm font-medium">
          <li><a href="#funciones" className="hover:text-roseA">Inicio</a></li>
          <li><a href="#modulos" className="hover:text-roseA">Módulos</a></li>
          <li><a href="#citas" className="hover:text-roseA">Citas</a></li>
          <li><a href="#reportes" className="hover:text-roseA">Reportes</a></li>
          <li><a href="#contacto" className="hover:text-roseA">Contacto</a></li>
        </ul>

        {/* Autenticación */}
        <ul className="flex items-center gap-4">
          {!isLogged ? (
            <>
              <li>
                <Link to="/login" className="hover:text-roseA">Iniciar sesión</Link>
              </li>
              <li>
                <Link
                  to="/registro"
                  className="px-5 py-2 rounded-full bg-gradient-to-r from-roseA to-roseB text-white shadow-soft"
                >
                  Registro
                </Link>
              </li>
            </>
          ) : (
            <>
              <li><Link to="/panel" className="hover:text-roseA">Panel</Link></li>
              <li>
                <button
                  onClick={handleLogout}
                  className="text-sm text-black/70 hover:text-roseA"
                >
                  Cerrar sesión
                </button>
              </li>
            </>
          )}
        </ul>

        {/* Botón móvil */}
        <button
          onClick={() => setOpen(true)}
          className="md:hidden p-2 rounded-lg border border-black/10"
          aria-label="Abrir menú"
        >
          <div className="w-5 h-0.5 bg-black mb-1"></div>
          <div className="w-5 h-0.5 bg-black mb-1"></div>
          <div className="w-5 h-0.5 bg-black"></div>
        </button>
      </nav>

      {/* Drawer móvil */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-72 bg-white shadow-2xl p-6">
            <button
              onClick={() => setOpen(false)}
              className="mb-6 px-3 py-1.5 rounded-full border"
              aria-label="Cerrar menú"
            >
              Cerrar ✕
            </button>

            <ul className="flex flex-col gap-4 text-sm">
              <li><a href="#funciones" className="hover:text-roseA">Inicio</a></li>
              <li><a href="#modulos" className="hover:text-roseA">Módulos</a></li>
              <li><a href="#citas" className="hover:text-roseA">Citas</a></li>
              <li><a href="#reportes" className="hover:text-roseA">Reportes</a></li>
              <li><a href="#contacto" className="hover:text-roseA">Contacto</a></li>
            </ul>

            <div className="mt-6 flex flex-col gap-3">
              <Link to="/login" className="px-4 py-2 rounded-full border border-roseA/20 hover:border-roseA/40 text-center">Iniciar sesión</Link>
              <Link to="/registro" className="px-4 py-2 rounded-full bg-gradient-to-r from-roseA to-roseB text-white shadow-soft text-center">Registro</Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
