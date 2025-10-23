// ✅ Importaciones principales
import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

// ✅ Páginas principales
import Home from "./pages/Home";
import Servicios from "./pages/Servicios";
import Equipo from "./pages/Equipo";
import Citas from "./pages/Citas";
import Contacto from "./pages/Contacto";
import Registro from "./pages/Registro";
import Login from "./pages/Login";
import Logout from "./pages/Logout";

// ✅ Nueva vista: Registrar Mascotas
import RegistrarMascotas from "./pages/RegistrarMascotas";

// ✅ Páginas de recuperación de contraseña
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

// ✅ Token para rutas protegidas
import { getToken } from "./auth";

// ===============================
// 🚀 Componente principal
// ===============================
export default function App() {
  return (
    <>
      <div className="min-h-screen">
        <Navbar />
        <Routes>
          {/* Páginas principales */}
          <Route path="/" element={<Home />} />
          <Route path="/servicios" element={<Servicios />} />
          <Route path="/equipo" element={<Equipo />} />

          {/* Citas (solo usuarios logueados) */}
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

          {/* 🐾 Nueva ruta para registrar mascotas */}
          <Route
            path="/registrar-mascotas"
            element={
              <Protected>
                <RegistrarMascotas />
              </Protected>
            }
          />

          {/* 🔑 Recuperación de contraseña */}
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:uidb64/:token" element={<ResetPassword />} />

          {/* Redirección por defecto */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        <Footer />
      </div>
    </>
  );
}

// ===============================
// 🔒 Protección de rutas
// ===============================
function Protected({ children }) {
  return getToken() ? children : <Navigate to="/login" replace />;
}
