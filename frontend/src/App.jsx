import { Routes, Route, Navigate } from "react-router-dom";
import VetRoute from "./components/routing/VetRoute";
import ClienteRoute from "./components/routing/ClienteRoute";

// Auth
import SeleccionLogin from "./pages/auth/SeleccionLogin";
import ClienteLogin from "./pages/auth/ClienteLogin";
import VeterinarioLogin from "./pages/auth/VeterinarioLogin";
import Registro from "./pages/auth/Registro";
import CuentaCreada from "./pages/auth/CuentaCreada";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";

// Cliente
import ClienteHome from "./pages/cliente/ClienteHome";
import Citas from "./pages/cliente/Citas";
import MisCitas from "./pages/cliente/MisCitas";
import MisMascotas from "./pages/cliente/MisMascotas";
import RegistrarMascotas from "./pages/mascotas/RegistrarMascotas";

// Veterinario
import VetHome from "./pages/veterinario/VetHome";
import VetAgenda from "./pages/veterinario/VetAgenda";
import VetCitas from "./pages/veterinario/VetCitas";
import VetPacientes from "./pages/veterinario/VetPacientes";
import VetFichaClinica from "./pages/veterinario/VetFichaClinica";
import VetAgendaDia from "./pages/veterinario/VetAgendaDia";
import VetHorarios from "./pages/veterinario/VetHorarios";
import VetInventario from "./pages/veterinario/VetInventario";
import VetPerfil from "./pages/veterinario/VetPerfil";
import VetReportes from "./pages/veterinario/VetReportes";
import ClientePerfil from "./pages/cliente/ClientePerfil";

import ConfigMotivosConsulta from "./pages/veterinario/ConfigMotivosConsultas";

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

      {/* Login */}
      <Route path="/login/cliente" element={<ClienteLogin />} />
      <Route path="/login/veterinario" element={<VeterinarioLogin />} />

      {/* Recuperación de contraseña */}
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:uidb64/:token" element={<ResetPassword />} />

      {/* Cliente (protegidas) */}
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
            <MisCitas />
          </ClienteRoute>
        }
      />
      <Route
        path="/cliente/agendar"
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
      <Route
        path="/cliente/mis-mascotas"
        element={
          <ClienteRoute>
            <MisMascotas />
          </ClienteRoute>
        }
      />
      <Route path="/cliente/perfil" element={<ClientePerfil />} />

      {/* Veterinario (protegidas) */}
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
        path="/veterinario/inventario"
        element={
          <VetRoute>
            <VetInventario />
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
        path="/veterinario/horarios"
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

      <Route
        path="/veterinario/perfil"
        element={
          <VetRoute>
            <VetPerfil />
          </VetRoute>
        }
      />
      <Route path="/veterinario/reportes" element={<VetReportes />} />
      <Route
        path="/veterinario/config-motivos"
        element={
          <VetRoute>
            <ConfigMotivosConsulta />
          </VetRoute>
        }
      />
      <Route path="*" element={<Navigate to="/seleccion-login" replace />} />

    </Routes>
  );
}

export default App;
