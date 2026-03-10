import React from 'react'
import { Outlet } from 'react-router-dom'
import Box from '@mui/material/Box'
import { Sidebar } from './Sidebar'
import { SidebarProvider } from './SidebarContext'

export const AppLayout: React.FC = () => (
  <SidebarProvider>
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden', width: '100%', bgcolor: 'background.default' }}>
      <Sidebar />
      <Box sx={{ flex: 1, overflowY: 'auto', height: '100vh', bgcolor: 'background.default' }}>
        <Outlet />
      </Box>
    </Box>
  </SidebarProvider>
)
