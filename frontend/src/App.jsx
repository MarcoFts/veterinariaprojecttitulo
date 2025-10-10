import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'

import Home from './pages/Home'
import Servicios from './pages/Servicios'
import Equipo from './pages/Equipo'
import Citas from './pages/Citas'
import Contacto from './pages/Contacto'
import Registro from './pages/Registro'
import Login from './pages/Login'
import Logout from './pages/Logout'
import { getToken } from './auth'

export default function App() {
  return (
    <>
      <div className="min-h-screen">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/servicios" element={<Servicios />} />
          <Route path="/equipo" element={<Equipo />} />
          <Route
            path="/citas"
            element={
              <Protected>
                <Citas />
              </Protected>
            }
          />
          <Route path="/contacto" element={<Contacto />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/login" element={<Login />} />
          <Route path="/logout" element={<Logout />} />
          {/* Redirección por defecto */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        <Footer />
      </div>
    </>
  )
}

// 🔒 Protección de rutas para usuarios logueados
function Protected({ children }) {
  return getToken() ? children : <Navigate to="/login" replace />
}
