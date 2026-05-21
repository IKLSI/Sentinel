import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import { useAuth } from "../features/auth/hooks/useAuth";
import { AppLayout } from "../layouts/AppLayout";

import { ErrorPage } from "../pages/ErrorPage";
import { LoginPage } from "../features/auth/pages/LoginPage";
import { AcceptInvitationPage } from "../features/auth/pages/AcceptInvitationPage";
import { ForgotPasswordPage } from "../features/auth/pages/ForgotPasswordPage";
import { ResetPasswordPage } from "../features/auth/pages/ResetPasswordPage";
import { DashboardPage } from "../features/dashboard/pages/DashboardPage";
import { TicketsPage } from "../features/tickets/pages/TicketsPage";
import { KanbanPage } from "../features/tickets/pages/KanbanPage";
import { TicketDetailPage } from "../features/tickets/pages/TicketDetailPage";
import { TimeTrackingPage } from "../features/timeTracking/pages/TimeTrackingPage";
import { ProjectsPage } from "../features/projects/pages/ProjectsPage";
import { ProjectDetailPage } from "../features/techHealth/pages/ProjectDetailPage";
import { ProfilePage } from "../features/users/pages/ProfilePage";
import { SettingsPage } from "../features/settings/pages/SettingsPage";

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
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
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return <>{children}</>;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  if (user?.role !== "Admin") return <Navigate to="/" replace />;
  return <>{children}</>;
};

const NonClientRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  if (user?.role === "Client") return <Navigate to="/tickets" replace />;
  return <>{children}</>;
};

export const AppRoutes: React.FC = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/accept-invitation" element={<AcceptInvitationPage />} />
    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
    <Route path="/reset-password" element={<ResetPasswordPage />} />
    <Route
      element={
        <PrivateRoute>
          <AppLayout />
        </PrivateRoute>
      }
    >
      <Route path="/" element={<NonClientRoute><DashboardPage /></NonClientRoute>} />
      <Route path="/tickets" element={<TicketsPage />} />
      <Route path="/tickets/kanban" element={<KanbanPage />} />
      <Route path="/tickets/:id" element={<TicketDetailPage />} />
      <Route path="/projects" element={<NonClientRoute><ProjectsPage /></NonClientRoute>} />
      <Route path="/projects/:id" element={<NonClientRoute><ProjectDetailPage /></NonClientRoute>} />
      <Route path="/time-tracking" element={<NonClientRoute><TimeTrackingPage /></NonClientRoute>} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route
        path="/settings"
        element={
          <NonClientRoute>
            <AdminRoute>
              <SettingsPage />
            </AdminRoute>
          </NonClientRoute>
        }
      />
    </Route>
    <Route path="*" element={<ErrorPage status={404} />} />
  </Routes>
);
