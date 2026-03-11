import React, { useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import DashboardOutlined from '@mui/icons-material/DashboardOutlined'
import ConfirmationNumberOutlined from '@mui/icons-material/ConfirmationNumberOutlined'
import ViewKanbanOutlined from '@mui/icons-material/ViewKanbanOutlined'
import AccountTreeOutlined from '@mui/icons-material/AccountTreeOutlined'
import AccessTimeOutlined from '@mui/icons-material/AccessTimeOutlined'
import ReceiptOutlined from '@mui/icons-material/ReceiptOutlined'
import SecurityOutlined from '@mui/icons-material/SecurityOutlined'
import PeopleOutlined from '@mui/icons-material/PeopleOutlined'
import BusinessOutlined from '@mui/icons-material/BusinessOutlined'
import ListAltOutlined from '@mui/icons-material/ListAltOutlined'
import ChevronRightOutlined from '@mui/icons-material/ChevronRightOutlined'
import Box from '@mui/material/Box'
import { useAuth } from '../features/auth/hooks/useAuth'
import { useSidebar } from './SidebarContext'

interface NavItem {
  to: string
  icon: React.ElementType
  label: string
  end?: boolean
}

interface NavSection {
  title: string
  items: NavItem[]
}

const navSections: NavSection[] = [
  {
    title: 'Vue globale',
    items: [
      { to: '/', icon: DashboardOutlined, label: 'Dashboard', end: true },
    ],
  },
  {
    title: 'Tickets',
    items: [
      { to: '/tickets', icon: ConfirmationNumberOutlined, label: 'Tous les tickets', end: true },
      { to: '/tickets/kanban', icon: ViewKanbanOutlined, label: 'Kanban' },
    ],
  },
  {
    title: 'Projets',
    items: [
      { to: '/projects', icon: AccountTreeOutlined, label: 'Tous les projets' },
    ],
  },
  {
    title: 'Time & Facturation',
    items: [
      { to: '/time-tracking', icon: AccessTimeOutlined, label: 'Time tracking' },
      { to: '/invoices', icon: ReceiptOutlined, label: 'Factures' },
    ],
  },
  {
    title: 'Technique',
    items: [
      { to: '/tech-health', icon: SecurityOutlined, label: 'Santé technique' },
    ],
  },
  {
    title: 'Administration',
    items: [
      { to: '/users', icon: PeopleOutlined, label: 'Utilisateurs' },
      { to: '/organization', icon: BusinessOutlined, label: 'Organisation' },
      { to: '/audit', icon: ListAltOutlined, label: 'Audit log' },
    ],
  },
]

export const Sidebar: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { isOpen, isMobile, close } = useSidebar()
  const isAdmin = user?.role === 'admin' || user?.role === 'manager'
  const filteredSections = navSections.filter((s) => s.title !== 'Administration' || isAdmin)

  useEffect(() => {
    if (isMobile) close()
  }, [location.pathname, isMobile])

  useEffect(() => {
    if (isMobile && isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isMobile, isOpen])

  if (isMobile && !isOpen) return null

  return (
    <>
      {isMobile && (
        <Box
          onClick={close}
          sx={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 199,
            backdropFilter: 'blur(2px)',
          }}
        />
      )}

      <Box
        className="d-flex flex-column overflow-auto"
        sx={{
          width: '232px',
          flexShrink: 0,
          height: '100vh',
          background: 'var(--s1)',
          borderRight: '1px solid var(--border)',
          overflowX: 'hidden',
          position: isMobile ? 'fixed' : 'relative',
          left: 0,
          top: 0,
          zIndex: isMobile ? 200 : 'auto',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: -60,
            left: -60,
            width: 200,
            height: 200,
            background: 'radial-gradient(circle, var(--accent-subtle) 0%, transparent 70%)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />

        <Box
          component="button"
          className="d-flex align-items-center gap-2"
          onClick={() => navigate('/')}
          sx={{
            all: 'unset',
            cursor: 'pointer',
            p: '18px 18px 16px',
            borderBottom: '1px solid var(--border)',
            position: 'relative',
            zIndex: 1,
            transition: 'opacity 0.15s',
            '&:hover': { opacity: 0.8 },
          }}
        >
          <Box
            className="d-flex align-items-center justify-content-center flex-shrink-0"
            sx={{
              width: 32,
              height: 32,
              background: 'linear-gradient(135deg, var(--accent) 0%, #818cf8 100%)',
              borderRadius: '9px',
              fontSize: '13px',
              fontWeight: 800,
              color: '#fff',
              letterSpacing: '-0.05em',
              boxShadow: '0 0 20px rgba(99,102,241,0.4), 0 2px 8px rgba(0,0,0,0.3)',
            }}
          >
            T
          </Box>
          <Box>
            <Box sx={{ fontSize: '14px', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text)', lineHeight: 1.2 }}>
              TMA<Box component="span" sx={{ color: 'var(--accent)' }}>flow</Box>
            </Box>
            <Box sx={{ fontSize: '9px', color: 'var(--muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase', mt: '1px' }}>
              workspace
            </Box>
          </Box>
        </Box>

        <Box
          component="nav"
          className="d-flex flex-column flex-grow-1 p-2"
          sx={{ gap: '2px', position: 'relative', zIndex: 1 }}
        >
          {filteredSections.map((section, si) => (
            <Box key={section.title} sx={{ mt: si > 0 ? '6px' : 0 }}>
              <Box className="d-flex align-items-center gap-2" sx={{ p: '10px 10px 5px' }}>
                <Box component="span" sx={{ fontFamily: 'var(--font-mono)', fontSize: '8.5px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                  {section.title}
                </Box>
                <Box className="flex-grow-1" sx={{ height: '1px', background: 'linear-gradient(90deg, var(--border), transparent)' }} />
              </Box>

              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end ?? item.to === '/'}
                  className="d-block text-decoration-none"
                >
                  {({ isActive }) => {
                    const Icon = item.icon
                    return (
                      <Box
                        className="d-flex align-items-center"
                        sx={{
                          gap: '9px',
                          p: '8px 10px',
                          borderRadius: '7px',
                          cursor: 'pointer',
                          position: 'relative',
                          background: isActive ? 'var(--accent-subtle)' : 'transparent',
                          borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                          transition: 'background 0.12s, border-color 0.12s',
                          '&:hover': !isActive ? { background: 'var(--s2)' } : {},
                        }}
                      >
                        <Box
                          className="d-flex align-items-center justify-content-center flex-shrink-0"
                          sx={{
                            width: 18,
                            height: 18,
                            color: isActive ? 'var(--accent)' : 'var(--muted)',
                            transition: 'color 0.12s',
                          }}
                        >
                          <Icon sx={{ fontSize: 14 }} />
                        </Box>
                        <Box
                          component="span"
                          className="flex-grow-1 text-truncate"
                          sx={{ fontSize: '13px', fontWeight: isActive ? 600 : 450, color: isActive ? 'var(--accent)' : 'var(--text-secondary)', letterSpacing: '-0.01em', transition: 'color 0.12s, font-weight 0.12s' }}
                        >
                          {item.label}
                        </Box>
                        {isActive && (
                          <ChevronRightOutlined sx={{ fontSize: 12, color: 'var(--accent)', opacity: 0.6, flexShrink: 0 }} />
                        )}
                      </Box>
                    )
                  }}
                </NavLink>
              ))}
            </Box>
          ))}
        </Box>
      </Box>
    </>
  )
}
