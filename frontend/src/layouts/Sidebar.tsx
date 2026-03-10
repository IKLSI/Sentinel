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
        <div
          onClick={close}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 199,
            backdropFilter: 'blur(2px)',
          }}
        />
      )}

      <div style={{
        width: '232px',
        flexShrink: 0,
        height: '100vh',
        background: 'var(--s1)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        overflowX: 'hidden',
        position: isMobile ? 'fixed' : 'relative',
        left: 0,
        top: 0,
        zIndex: isMobile ? 200 : 'auto',
      }}>
        <div style={{
          position: 'absolute',
          top: -60,
          left: -60,
          width: 200,
          height: 200,
          background: 'radial-gradient(circle, var(--accent-subtle) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }} />

        <button
          onClick={() => navigate('/')}
          style={{
            all: 'unset',
            cursor: 'pointer',
            padding: '18px 18px 16px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            position: 'relative',
            zIndex: 1,
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.8' }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
        >
          <div style={{
            width: 32,
            height: 32,
            background: 'linear-gradient(135deg, var(--accent) 0%, #818cf8 100%)',
            borderRadius: '9px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '13px',
            fontWeight: 800,
            color: '#fff',
            letterSpacing: '-0.05em',
            flexShrink: 0,
            boxShadow: '0 0 20px rgba(99,102,241,0.4), 0 2px 8px rgba(0,0,0,0.3)',
          }}>
            T
          </div>
          <div>
            <div style={{
              fontSize: '14px',
              fontWeight: 700,
              letterSpacing: '-0.03em',
              color: 'var(--text)',
              lineHeight: 1.2,
            }}>
              TMA<span style={{ color: 'var(--accent)' }}>flow</span>
            </div>
            <div style={{
              fontSize: '9px',
              color: 'var(--muted)',
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginTop: '1px',
            }}>
              workspace
            </div>
          </div>
        </button>

        <nav style={{
          flex: 1,
          padding: '10px 8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
          position: 'relative',
          zIndex: 1,
        }}>
          {filteredSections.map((section, si) => (
            <div key={section.title} style={{ marginTop: si > 0 ? '6px' : 0 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 10px 5px',
              }}>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '8.5px',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'var(--muted)',
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                }}>
                  {section.title}
                </span>
                <div style={{
                  flex: 1,
                  height: '1px',
                  background: 'linear-gradient(90deg, var(--border), transparent)',
                }} />
              </div>

              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end ?? item.to === '/'}
                  style={{ textDecoration: 'none', display: 'block' }}
                >
                  {({ isActive }) => {
                    const Icon = item.icon
                    return (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '9px',
                          padding: '8px 10px',
                          borderRadius: '7px',
                          cursor: 'pointer',
                          position: 'relative',
                          background: isActive ? 'var(--accent-subtle)' : 'transparent',
                          borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                          transition: 'background 0.12s, border-color 0.12s',
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.background = 'var(--s2)'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.background = 'transparent'
                          }
                        }}
                      >
                        <div style={{
                          width: 18,
                          height: 18,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          color: isActive ? 'var(--accent)' : 'var(--muted)',
                          transition: 'color 0.12s',
                        }}>
                          <Icon sx={{ fontSize: 14 }} />
                        </div>
                        <span style={{
                          flex: 1,
                          fontSize: '13px',
                          fontWeight: isActive ? 600 : 450,
                          color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                          letterSpacing: '-0.01em',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          transition: 'color 0.12s, font-weight 0.12s',
                        }}>
                          {item.label}
                        </span>
                        {isActive ? (
                          <ChevronRightOutlined sx={{ fontSize: 12 }} style={{ color: 'var(--accent)', opacity: 0.6, flexShrink: 0 }} />
                        ) : null}
                      </div>
                    )
                  }}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

      </div>
    </>
  )
}
