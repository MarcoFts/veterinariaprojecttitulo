import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getAccessToken, logout } from "../auth";
import axios from "axios";

export default function Navbar() {
  const [open, setOpen] = useState(false); // menú móvil
  const [menuOpen, setMenuOpen] = useState(false); // menú usuario
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const token = getAccessToken();

  // ✅ Cargar perfil al iniciar
  useEffect(() => {
    const fetchUser = async () => {
      if (!token) return;

      try {
        const res = await axios.get("http://127.0.0.1:8000/api/auth/me/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data);
      } catch (err) {
        console.error("Error al obtener usuario:", err);
        setUser(null);
      }
    };
    fetchUser();
  }, [token]);

  const handleLogout = () => {
    logout();
    setUser(null);
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur bg-white/70 border-b border-white/40">
      <nav className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-roseA to-roseB shadow-soft grid place-items-center text-white font-bold">
            V
          </div>
          <span className="font-display text-xl font-extrabold">
            Vet<strong className="text-roseA">Care</strong>
          </span>
        </Link>

        {/* Menú principal */}
        <ul className="hidden md:flex items-center gap-6 text-sm font-medium">
          <li><Link to="/" className="hover:text-roseA">Inicio</Link></li>
          <li><Link to="/modulos" className="hover:text-roseA">Módulos</Link></li>
          <li><Link to="/citas" className="hover:text-roseA">Citas</Link></li>
          <li><Link to="/reportes" className="hover:text-roseA">Reportes</Link></li>
          <li><Link to="/contacto" className="hover:text-roseA">Contacto</Link></li>
        </ul>

        {/* Autenticación */}
        <ul className="flex items-center gap-4">
          {!user ? (
            <>
              <li>
                <Link
                  to="/login"
                  className="hover:text-roseA transform transition-transform duration-300 hover:scale-105"
                >
                  Iniciar sesión
                </Link>
              </li>
              <li>
                <Link
                  to="/registro"
                  className="px-5 py-2 rounded-full bg-gradient-to-r from-roseA to-roseB text-white shadow-soft transform transition-transform duration-300 hover:scale-105 hover:shadow-lg hover:shadow-roseA/30"
                >
                  Registro
                </Link>
              </li>
            </>
          ) : (
            <li className="relative">
              {/* Botón desplegable */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 bg-gradient-to-r from-roseA/10 to-roseB/10 hover:from-roseA/20 hover:to-roseB/20 px-4 py-2 rounded-full text-roseA font-semibold transition"
              >
                <span>Hola, {user.name || user.first_name || "Usuario"}</span>
                <span className="text-lg">☰</span>
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-roseA/10 shadow-lg rounded-xl py-2 z-50 animate-fade-in">
                  <Link
                    to="/registrar-mascotas"
                    className="block px-4 py-2 text-sm text-black/80 hover:bg-roseA/10 hover:text-roseA"
                    onClick={() => setMenuOpen(false)}
                  >
                    Registrar Mascota
                  </Link>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      handleLogout();
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-black/80 hover:bg-roseA/10 hover:text-roseA"
                  >
                    Cerrar sesión
                  </button>
                </div>
              )}
            </li>
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
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-0 h-full w-72 bg-white shadow-2xl p-6">
            <button
              onClick={() => setOpen(false)}
              className="mb-6 px-3 py-1.5 rounded-full border"
              aria-label="Cerrar menú"
            >
              Cerrar ✕
            </button>

            <ul className="flex flex-col gap-4 text-sm">
              <li><Link to="/" className="hover:text-roseA">Inicio</Link></li>
              <li><Link to="/modulos" className="hover:text-roseA">Módulos</Link></li>
              <li><Link to="/citas" className="hover:text-roseA">Citas</Link></li>
              <li><Link to="/reportes" className="hover:text-roseA">Reportes</Link></li>
              <li><Link to="/contacto" className="hover:text-roseA">Contacto</Link></li>
            </ul>

            <div className="mt-6 flex flex-col gap-3">
              {!user ? (
                <>
                  <Link
                    to="/login"
                    className="px-4 py-2 rounded-full border border-roseA/20 hover:border-roseA/40 text-center"
                  >
                    Iniciar sesión
                  </Link>
                  <Link
                    to="/registro"
                    className="px-4 py-2 rounded-full bg-gradient-to-r from-roseA to-roseB text-white shadow-soft text-center"
                  >
                    Registro
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/registrar-mascotas"
                    className="px-4 py-2 rounded-full border border-roseA/20 hover:bg-roseA/10 text-center"
                    onClick={() => setOpen(false)}
                  >
                    Registrar Mascota
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 rounded-full bg-roseA/10 hover:bg-roseA/20 text-roseA text-center"
                  >
                    Cerrar sesión
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
