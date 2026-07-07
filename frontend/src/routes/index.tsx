import React, { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import { useAuth } from "../features/auth/hooks/useAuth";
import { UserRole } from "../types/enums";
import { ROUTES } from "@/constants/routes";
import { AppLayout } from "../layouts/AppLayout";
import { ErrorPage } from "../pages/ErrorPage";

const PrivacyPage = lazy(() =>
  import("../pages/PrivacyPage").then((m) => ({
    default: m.PrivacyPage,
  })),
);

const LoginPage = lazy(() =>
  import("../features/auth/pages/LoginPage").then((m) => ({
    default: m.LoginPage,
  })),
);
const AcceptInvitationPage = lazy(() =>
  import("../features/auth/pages/AcceptInvitationPage").then((m) => ({
    default: m.AcceptInvitationPage,
  })),
);
const VerifyEmailPage = lazy(() =>
  import("../features/auth/pages/VerifyEmailPage").then((m) => ({
    default: m.VerifyEmailPage,
  })),
);
const ResetPasswordPage = lazy(() =>
  import("../features/auth/pages/ResetPasswordPage").then((m) => ({
    default: m.ResetPasswordPage,
  })),
);
const DashboardPage = lazy(() =>
  import("../features/dashboard/pages/DashboardPage").then((m) => ({
    default: m.DashboardPage,
  })),
);
const TicketsPage = lazy(() =>
  import("../features/tickets/pages/TicketsPage").then((m) => ({
    default: m.TicketsPage,
  })),
);
const KanbanPage = lazy(() =>
  import("../features/tickets/pages/KanbanPage").then((m) => ({
    default: m.KanbanPage,
  })),
);
const TicketDetailPage = lazy(() =>
  import("../features/tickets/pages/TicketDetailPage").then((m) => ({
    default: m.TicketDetailPage,
  })),
);
const TimeTrackingPage = lazy(() =>
  import("../features/timeTracking/pages/TimeTrackingPage").then((m) => ({
    default: m.TimeTrackingPage,
  })),
);
const ProjectsPage = lazy(() =>
  import("../features/projects/pages/ProjectsPage").then((m) => ({
    default: m.ProjectsPage,
  })),
);
const ProjectDetailPage = lazy(() =>
  import("../features/techHealth/pages/ProjectDetailPage").then((m) => ({
    default: m.ProjectDetailPage,
  })),
);
const ProfilePage = lazy(() =>
  import("../features/users/pages/ProfilePage").then((m) => ({
    default: m.ProfilePage,
  })),
);
const SettingsPage = lazy(() =>
  import("../features/settings/pages/SettingsPage").then((m) => ({
    default: m.SettingsPage,
  })),
);
const UsersPage = lazy(() =>
  import("../features/users/pages/UsersPage").then((m) => ({
    default: m.UsersPage,
  })),
);
const OrganisationPage = lazy(() =>
  import("../features/settings/pages/OrganisationPage").then((m) => ({
    default: m.OrganisationPage,
  })),
);

const FullScreenLoader: React.FC = () => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      bgcolor: "background.default",
    }}
  >
    <CircularProgress size={32} />
  </Box>
);

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <FullScreenLoader />;
  if (!isAuthenticated) return <Navigate to={ROUTES.LOGIN} replace />;

  return <>{children}</>;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  if (user?.role !== UserRole.Admin)
    return <Navigate to={ROUTES.HOME} replace />;
  return <>{children}</>;
};

export const AppRoutes: React.FC = () => (
  <Suspense fallback={<FullScreenLoader />}>
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/accept-invitation" element={<AcceptInvitationPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route
        element={
          <PrivateRoute>
            <AppLayout />
          </PrivateRoute>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/tickets" element={<TicketsPage />} />
        <Route path="/tickets/kanban" element={<KanbanPage />} />
        <Route path="/tickets/:id" element={<TicketDetailPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:id" element={<ProjectDetailPage />} />
        <Route path="/time-tracking" element={<TimeTrackingPage />} />

        <Route path="/profile" element={<ProfilePage />} />
        <Route
          path="/settings"
          element={
            <AdminRoute>
              <SettingsPage />
            </AdminRoute>
          }
        />
        <Route
          path="/organisation"
          element={
            <AdminRoute>
              <OrganisationPage />
            </AdminRoute>
          }
        />
        <Route
          path="/users"
          element={
            <AdminRoute>
              <UsersPage />
            </AdminRoute>
          }
        />
      </Route>
      <Route path="*" element={<ErrorPage status={404} />} />
    </Routes>
  </Suspense>
);
