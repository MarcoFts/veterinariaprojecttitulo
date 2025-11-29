import { Routes, Route, Navigate } from "react-router-dom";

// Auth
import SeleccionLogin from "./pages/auth/SeleccionLogin";
import ClienteLogin from "./pages/auth/ClienteLogin";
import VeterinarioLogin from "./pages/auth/VeterinarioLogin";
import Registro from "./pages/auth/Registro";
import CuentaCreada from "./pages/auth/CuentaCreada";

// Cliente
import ClienteHome from "./pages/cliente/ClienteHome";
import Citas from "./pages/cliente/Citas";
import RegistrarMascotas from "./pages/mascotas/RegistrarMascotas";

// Veterinario
import VetHome from "./pages/veterinario/VetHome";
import VetAgenda from "./pages/veterinario/VetAgenda";
import VetCitas from "./pages/veterinario/VetCitas";
import VetPacientes from "./pages/veterinario/VetPacientes";
import VetFichaClinica from "./pages/veterinario/VetFichaClinica";
import VetAgendaDia from "./pages/veterinario/VetAgendaDia"; // 🔹 NUEVO

function App() {
  return (
    <Routes>
      {/* Root → selección */}
      <Route path="/" element={<Navigate to="/seleccion-login" replace />} />

      {/* Selección */}
      <Route path="/seleccion-login" element={<SeleccionLogin />} />

      {/* Registro */}
      <Route path="/registro" element={<Registro />} />
      <Route path="/cuenta-creada" element={<CuentaCreada />} />

      {/* Logins */}
      <Route path="/login/cliente" element={<ClienteLogin />} />
      <Route path="/login/veterinario" element={<VeterinarioLogin />} />

      {/* Cliente */}
      <Route path="/cliente/home" element={<ClienteHome />} />
      <Route path="/cliente/citas" element={<Citas />} />
      <Route path="/cliente/mascotas" element={<RegistrarMascotas />} />

      {/* Veterinario */}
      <Route path="/veterinario/home" element={<VetHome />} />
      <Route path="/veterinario/agenda" element={<VetAgenda />} />
      <Route path="/veterinario/agenda-dia" element={<VetAgendaDia />} /> {/* NUEVA */}
      <Route path="/veterinario/citas" element={<VetCitas />} />

      {/* Pacientes */}
      <Route path="/veterinario/pacientes" element={<VetPacientes />} />

      {/* Ficha clínica */}
      <Route path="/veterinario/paciente/:id" element={<VetFichaClinica />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/seleccion-login" replace />} />
    </Routes>
  );
}

export default App;
