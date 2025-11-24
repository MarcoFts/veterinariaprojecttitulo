import { Routes, Route, Navigate } from "react-router-dom";

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

      {/* Cliente */}
      <Route path="/cliente/home" element={<ClienteHome />} />
      <Route path="/citas" element={<Citas />} />
      <Route path="/registrar-mascotas" element={<RegistrarMascotas />} />

      {/* Veterinario */}
      <Route path="/veterinario/home" element={<VetHome />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/seleccion-login" replace />} />
    </Routes>
  );
}

export default App;
