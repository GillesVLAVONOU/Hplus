import type { ReactNode } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import "./App.css";
import "./motion.css";
import "./styles/brish-theme.css";
import "./styles/luxury-redesign.css";
import { AuthProvider } from "./auth";
import { useAuth } from "./auth-context";
import type { Role } from "./api";
import { HomePage, RoomDetailPage } from "./pages/public/PublicPages";
import { AuthPage } from "./pages/auth/AuthPage";
import { AccountPage, BookingPage } from "./pages/client/ClientPages";
import { StaffDashboardPage } from "./pages/staff/DashboardPage";
import { StaffReservationsPage } from "./pages/staff/ReservationsPage";
import { PlanningPage } from "./pages/staff/PlanningPage";
import { RoomManagementPage } from "./pages/staff/RoomManagementPage";
import { UserAdministrationPage } from "./pages/staff/UserAdministrationPage";
import { ClientManagementPage } from "./pages/staff/ClientManagementPage";

function Protected({
  children,
  roles,
}: {
  children: ReactNode;
  roles?: Role[];
}) {
  const { user, ready } = useAuth();
  const location = useLocation();
  if (!ready)
    return <div className="page-loading">Chargement de votre espace?</div>;
  if (!user) {
    const next = `${location.pathname}${location.search}`;
    return (
      <Navigate to={`/connexion?next=${encodeURIComponent(next)}`} replace />
    );
  }
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/chambres/:id" element={<RoomDetailPage />} />
      <Route path="/connexion" element={<AuthPage mode="login" />} />
      <Route path="/inscription" element={<AuthPage mode="register" />} />
      <Route
        path="/reservation"
        element={
          <Protected roles={["CLIENT"]}>
            <BookingPage />
          </Protected>
        }
      />
      <Route
        path="/compte"
        element={
          <Protected roles={["CLIENT"]}>
            <AccountPage />
          </Protected>
        }
      />
      <Route
        path="/personnel"
        element={
          <Protected roles={["RECEPTIONNISTE", "ADMINISTRATEUR"]}>
            <StaffDashboardPage />
          </Protected>
        }
      />
      <Route
        path="/personnel/reservations"
        element={
          <Protected roles={["RECEPTIONNISTE", "ADMINISTRATEUR"]}>
            <StaffReservationsPage />
          </Protected>
        }
      />
      <Route
        path="/personnel/planning"
        element={
          <Protected roles={["RECEPTIONNISTE", "ADMINISTRATEUR"]}>
            <PlanningPage />
          </Protected>
        }
      />
      <Route
        path="/personnel/clients"
        element={
          <Protected roles={["RECEPTIONNISTE", "ADMINISTRATEUR"]}>
            <ClientManagementPage />
          </Protected>
        }
      />
      <Route
        path="/personnel/chambres"
        element={
          <Protected roles={["ADMINISTRATEUR"]}>
            <RoomManagementPage />
          </Protected>
        }
      />
      <Route
        path="/personnel/types-chambres"
        element={
          <Protected roles={["ADMINISTRATEUR"]}>
            <RoomManagementPage />
          </Protected>
        }
      />
      <Route
        path="/administration/utilisateurs"
        element={
          <Protected roles={["ADMINISTRATEUR"]}>
            <UserAdministrationPage />
          </Protected>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
