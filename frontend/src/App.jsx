import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import WhatsAppFloat from './components/WhatsAppFloat'

import Home from './pages/Home'
import Servicios from './pages/Servicios'
import Equipo from './pages/Equipo'
import Citas from './pages/Citas'
import Contacto from './pages/Contacto'
import Registro from './pages/Registro'
import Login from './pages/Login'
import { getToken } from './auth'
import Logout from './pages/Logout'

export default function App() {
  return (
    <>
      <div className="min-h-screen">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/servicios" element={<Servicios />} />
          <Route path="/equipo" element={<Equipo />} />
          <Route path="/citas" element={
            <Protected><Citas /></Protected>
              }/>
          <Route path="*" element={<Navigate to="/" />} />
          <Route path="/contacto" element={<Contacto />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/login" element={<Login />} />
          <Route path="/logout" element={<Logout />} />
        </Routes>
        <Footer />
      </div>
      <WhatsAppFloat phone="+56912345678" />
    </>
  )
}
function Protected({ children }) {
  return getToken() ? children : <Navigate to="/login" replace />
}

const isAuth = !!localStorage.getItem('access');
<Route path="/citas" element={isAuth ? <Citas/> : <Navigate to="/login" replace/>} />