import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './features/auth/context/AuthContext'
import { ThemeProvider } from './store/ThemeContext'
import { NotificationProvider } from './features/notifications/context/NotificationContext'
import { ToastProvider } from './hooks/ToastProvider'
import { App } from './App'
import './styles/variables.css'
import './styles/global.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <ThemeProvider>
          <ToastProvider>
            <NotificationProvider>
              <App />
            </NotificationProvider>
          </ToastProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
