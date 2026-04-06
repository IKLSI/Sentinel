import React, { useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import DashboardOutlined from '@mui/icons-material/DashboardOutlined'
import ConfirmationNumberOutlined from '@mui/icons-material/ConfirmationNumberOutlined'
import ViewKanbanOutlined from '@mui/icons-material/ViewKanbanOutlined'
import AccountTreeOutlined from '@mui/icons-material/AccountTreeOutlined'
import AccessTimeOutlined from '@mui/icons-material/AccessTimeOutlined'
import ReceiptOutlined from '@mui/icons-material/ReceiptOutlined'
import SecurityOutlined from '@mui/icons-material/SecurityOutlined'
import LogoutOutlined from '@mui/icons-material/LogoutOutlined'
import SettingsOutlined from '@mui/icons-material/SettingsOutlined'
import PersonOutlined from '@mui/icons-material/PersonOutlined'
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
      { to: '/', icon: DashboardOutlined, label: 'Tableau de bord', end: true },
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
    title: 'Temps & Facturation',
    items: [
      { to: '/time-tracking', icon: AccessTimeOutlined, label: 'Suivi du temps' },
      { to: '/invoices', icon: ReceiptOutlined, label: 'Factures' },
    ],
  },
  {
    title: 'Technique',
    items: [
      { to: '/tech-health', icon: SecurityOutlined, label: 'Santé technique' },
    ],
  },
]

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const initials = user ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : 'U'
  const isAdmin = user?.role === 'Admin'
  const location = useLocation()
  const { isOpen, isMobile, close } = useSidebar()
  const isDeveloper = user?.role === 'Developer'
  const filteredSections = navSections
    .map((section) => {
      if (section.title === 'Temps & Facturation') {
        const items = isDeveloper
          ? section.items.filter((i) => i.to !== '/invoices')
          : section.items
        return { ...section, title: isDeveloper ? 'Temps' : section.title, items }
      }
      return section
    })
    .filter((section) => section.items.length > 0)

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
          borderRight: 'none',
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
            borderBottom: 'none',
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
            S
          </Box>
          <Box>
            <Box sx={{ fontSize: '11.5px', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--text)', lineHeight: 1.2 }}>
              SENTINEL
            </Box>
            <Box sx={{ fontSize: '9.5px', color: 'var(--muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase', mt: '1px' }}>
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
                          boxShadow: isActive ? 'inset 2px 0 0 var(--accent)' : 'none',
                          transition: 'background 0.12s, box-shadow 0.12s',
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
                      </Box>
                    )
                  }}
                </NavLink>
              ))}
            </Box>
          ))}
        </Box>

        <Box
          className="d-flex align-items-center gap-2"
          sx={{
            p: '12px 14px',
            mt: 'auto',
            position: 'relative',
            zIndex: 1,
            background: 'var(--s2)',
          }}
        >
          <Box
            component="button"
            className="d-flex align-items-center gap-2 flex-grow-1 overflow-hidden"
            onClick={() => navigate('/profile')}
            sx={{
              all: 'unset',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexGrow: 1,
              overflow: 'hidden',
              borderRadius: '8px',
              p: '4px 6px 4px 0',
              transition: 'opacity 0.12s',
              '&:hover': { opacity: 0.75 },
            }}
          >
            <Box
              className="d-flex align-items-center justify-content-center flex-shrink-0"
              sx={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                background: 'var(--s3)',
                color: 'var(--muted)',
              }}
            >
              <PersonOutlined sx={{ fontSize: 18 }} />
            </Box>
            <Box className="overflow-hidden">
              <Box sx={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em', lineHeight: 1.3 }}>
                {user?.firstName} {user?.lastName}
              </Box>
              <Box className="text-truncate" sx={{ fontSize: '10px', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
                {user?.email}
              </Box>
            </Box>
          </Box>
          {isAdmin && (
            <Box
              component="button"
              sx={{
                all: 'unset',
                cursor: 'pointer',
                width: 28,
                height: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '7px',
                color: 'var(--muted)',
                flexShrink: 0,
                transition: 'color 0.12s, background 0.12s',
                '&:hover': { color: 'var(--accent)', background: 'var(--accent-subtle)' },
              }}
              onClick={() => navigate('/settings')}
              title="Paramétrage"
            >
              <SettingsOutlined sx={{ fontSize: 14 }} />
            </Box>
          )}
          <Box
            component="button"
            sx={{
              all: 'unset',
              cursor: 'pointer',
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '7px',
              color: 'var(--muted)',
              flexShrink: 0,
              transition: 'color 0.12s, background 0.12s',
              '&:hover': { color: 'var(--red)', background: 'rgba(239,68,68,0.08)' },
            }}
            onClick={handleLogout}
            title="Déconnexion"
          >
            <LogoutOutlined sx={{ fontSize: 14 }} />
          </Box>
        </Box>
      </Box>
    </>
  )
}
