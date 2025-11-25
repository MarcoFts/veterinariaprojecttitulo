import { Routes, Route, Navigate } from "react-router-dom";
import RequireAuth from "./components/RequireAuth";

// Auth
import SeleccionLogin from "./pages/auth/SeleccionLogin";
import ClienteLogin from "./pages/auth/ClienteLogin";
import VeterinarioLogin from "./pages/auth/VeterinarioLogin";

// Cliente
import ClienteHome from "./pages/cliente/ClienteHome";
import Citas from "./pages/cliente/Citas";
import RegistrarMascotas from "./pages/mascotas/RegistrarMascotas";

// Veterinario
import VetHome from "./pages/veterinario/VetHome";
import VetAgenda from "./pages/veterinario/VetAgenda";

function App() {
  return (
    <Routes>
      {/* Root → selección */}
      <Route path="/" element={<Navigate to="/seleccion-login" replace />} />

      {/* Selección tipo de usuario */}
      <Route path="/seleccion-login" element={<SeleccionLogin />} />

      {/* Logins */}
      <Route path="/login/cliente" element={<ClienteLogin />} />
      <Route path="/login/veterinario" element={<VeterinarioLogin />} />

      {/* =========================
          RUTAS PROTEGIDAS CLIENTE
         ========================= */}
      <Route element={<RequireAuth />}>
        <Route path="/cliente/home" element={<ClienteHome />} />
        <Route path="/cliente/citas" element={<Citas />} />

        {/* Mis mascotas (por ahora usamos registrar como vista principal) */}
        <Route path="/cliente/mascotas" element={<RegistrarMascotas />} />

        {/* Registrar mascota (ruta opcional si la usas desde botones) */}
        <Route
          path="/cliente/mascotas/registrar"
          element={<RegistrarMascotas />}
        />
      </Route>

      {/* Veterinario */}
      <Route path="/veterinario/home" element={<VetHome />} />
      <Route path="/veterinario/agenda" element={<VetAgenda />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/seleccion-login" replace />} />
    </Routes>
  );
}

export default App;
