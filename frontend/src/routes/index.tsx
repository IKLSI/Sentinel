import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'
import { useAuth } from '../features/auth/hooks/useAuth'
import { AppLayout } from '../layouts/AppLayout'

import { LoginPage } from '../features/auth/pages/LoginPage'
import { DashboardPage } from '../features/dashboard/pages/DashboardPage'
import { TicketsPage } from '../features/tickets/pages/TicketsPage'
import { KanbanPage } from '../features/tickets/pages/KanbanPage'
import { TicketDetailPage } from '../features/tickets/pages/TicketDetailPage'
import { TimeTrackingPage } from '../features/timeTracking/pages/TimeTrackingPage'
import { InvoicesPage } from '../features/invoices/pages/InvoicesPage'
import { InvoiceDetailPage } from '../features/invoices/pages/InvoiceDetailPage'
import { TechHealthPage } from '../features/techHealth/pages/TechHealthPage'
import { ProjectsPage } from '../features/projects/pages/ProjectsPage'
import { ProjectDetailPage } from '../features/techHealth/pages/ProjectDetailPage'
import { ProfilePage } from '../features/users/pages/ProfilePage'
import { SettingsPage } from '../features/settings/pages/SettingsPage'

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', bgcolor: 'background.default' }}>
        <CircularProgress size={32} />
      </Box>
    )
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />

  return <>{children}</>
}

const NonDeveloperRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth()
  if (user?.role === 'Developer') return <Navigate to="/" replace />
  return <>{children}</>
}

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth()
  if (user?.role !== 'Admin') return <Navigate to="/" replace />
  return <>{children}</>
}

export const AppRoutes: React.FC = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/tickets" element={<TicketsPage />} />
      <Route path="/tickets/kanban" element={<KanbanPage />} />
      <Route path="/tickets/:id" element={<TicketDetailPage />} />
      <Route path="/projects" element={<ProjectsPage />} />
      <Route path="/projects/:id" element={<ProjectDetailPage />} />
      <Route path="/time-tracking" element={<TimeTrackingPage />} />
      <Route path="/invoices" element={<NonDeveloperRoute><InvoicesPage /></NonDeveloperRoute>} />
      <Route path="/invoices/:id" element={<NonDeveloperRoute><InvoiceDetailPage /></NonDeveloperRoute>} />
      <Route path="/tech-health" element={<TechHealthPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/settings" element={<AdminRoute><SettingsPage /></AdminRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Route>
  </Routes>
)
