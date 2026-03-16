import React from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Box from '@mui/material/Box'
import { Sidebar } from './Sidebar'
import { SidebarProvider } from './SidebarContext'
import { PageTransition } from './PageTransition'

export const AppLayout: React.FC = () => {
  const { pathname } = useLocation()
  return (
    <SidebarProvider>
      <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden', width: '100%', bgcolor: 'background.default' }}>
        <div key={pathname} className="page-progress-bar" aria-hidden="true" />
        <Sidebar />
        <Box sx={{ flex: 1, overflowY: 'auto', height: '100vh', bgcolor: 'background.default' }}>
          <PageTransition>
            <Outlet />
          </PageTransition>
        </Box>
      </Box>
    </SidebarProvider>
  )
}
