import { Routes, Route, Navigate } from "react-router-dom";
import VetRoute from "./components/routing/VetRoute";
import ClienteRoute from "./components/routing/ClienteRoute";

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
import VetAgendaDia from "./pages/veterinario/VetAgendaDia";
import VetHorarios from "./pages/veterinario/VetHorarios";

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

      {/* Cliente (PROTEGIDAS) */}
      <Route
        path="/cliente/home"
        element={
          <ClienteRoute>
            <ClienteHome />
          </ClienteRoute>
        }
      />
      <Route
        path="/cliente/citas"
        element={
          <ClienteRoute>
            <Citas />
          </ClienteRoute>
        }
      />
      <Route
        path="/cliente/mascotas"
        element={
          <ClienteRoute>
            <RegistrarMascotas />
          </ClienteRoute>
        }
      />

      {/* Veterinario (PROTEGIDAS) */}
      <Route
        path="/veterinario/home"
        element={
          <VetRoute>
            <VetHome />
          </VetRoute>
        }
      />
      <Route
        path="/veterinario/agenda"
        element={
          <VetRoute>
            <VetAgenda />
          </VetRoute>
        }
      />
      <Route
        path="/veterinario/agenda-dia"
        element={
          <VetRoute>
            <VetAgendaDia />
          </VetRoute>
        }
      />
      <Route
        path="/veterinario/citas"
        element={
          <VetRoute>
            <VetCitas />
          </VetRoute>
        }
      />
      <Route
        path="/vet/horarios"
        element={
          <VetRoute>
            <VetHorarios />
          </VetRoute>
        }
      />
      <Route
        path="/veterinario/pacientes"
        element={
          <VetRoute>
            <VetPacientes />
          </VetRoute>
        }
      />
      <Route
        path="/veterinario/paciente/:id"
        element={
          <VetRoute>
            <VetFichaClinica />
          </VetRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/seleccion-login" replace />} />
    </Routes>
  );
}

export default App;
