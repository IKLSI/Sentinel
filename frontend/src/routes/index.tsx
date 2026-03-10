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
import { NewTicketPage } from '../features/tickets/pages/NewTicketPage'
import { TimeTrackingPage } from '../features/timeTracking/pages/TimeTrackingPage'
import { InvoicesPage } from '../features/invoices/pages/InvoicesPage'
import { InvoiceDetailPage } from '../features/invoices/pages/InvoiceDetailPage'
import { TechHealthPage } from '../features/techHealth/pages/TechHealthPage'
import { NotificationsPage } from '../features/notifications/pages/NotificationsPage'
import { UsersPage } from '../features/users/pages/UsersPage'
import { OrganizationPage } from '../features/organization/pages/OrganizationPage'
import { AuditPage } from '../features/users/pages/AuditPage'
import { ProjectsPage } from '../features/projects/pages/ProjectsPage'
import { ProjectDetailPage } from '../features/techHealth/pages/ProjectDetailPage'

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

export const AppRoutes: React.FC = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/tickets" element={<TicketsPage />} />
      <Route path="/tickets/kanban" element={<KanbanPage />} />
      <Route path="/tickets/new" element={<NewTicketPage />} />
      <Route path="/tickets/:id" element={<TicketDetailPage />} />
      <Route path="/projects" element={<ProjectsPage />} />
      <Route path="/projects/:id" element={<ProjectDetailPage />} />
      <Route path="/time-tracking" element={<TimeTrackingPage />} />
      <Route path="/invoices" element={<InvoicesPage />} />
      <Route path="/invoices/:id" element={<InvoiceDetailPage />} />
      <Route path="/tech-health" element={<TechHealthPage />} />
      <Route path="/notifications" element={<NotificationsPage />} />
      <Route path="/users" element={<UsersPage />} />
      <Route path="/organization" element={<OrganizationPage />} />
      <Route path="/audit" element={<AuditPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Route>
  </Routes>
)
