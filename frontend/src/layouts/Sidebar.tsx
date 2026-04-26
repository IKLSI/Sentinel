import React, { useEffect, useMemo, useState } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import DashboardOutlined from '@mui/icons-material/DashboardOutlined'
import ConfirmationNumberOutlined from '@mui/icons-material/ConfirmationNumberOutlined'
import ViewKanbanOutlined from '@mui/icons-material/ViewKanbanOutlined'
import AccountTreeOutlined from '@mui/icons-material/AccountTreeOutlined'
import AccessTimeOutlined from '@mui/icons-material/AccessTimeOutlined'
import AssessmentOutlined from '@mui/icons-material/AssessmentOutlined'
import ReceiptOutlined from '@mui/icons-material/ReceiptOutlined'
import LogoutOutlined from '@mui/icons-material/LogoutOutlined'
import SettingsOutlined from '@mui/icons-material/SettingsOutlined'
import ChevronRightOutlined from '@mui/icons-material/ChevronRightOutlined'
import PersonOutlined from '@mui/icons-material/PersonOutlined'
import Box from '@mui/material/Box'
import { useAuth } from '../features/auth/hooks/useAuth'
import { useSidebar } from './SidebarContext'
import { SentinelLogo } from './SentinelLogo'

interface NavItem {
  to: string
  icon: React.ElementType
  label: string
  end?: boolean
}

interface NavSection {
  title: string
  icon: React.ElementType
  items: NavItem[]
}

const navSections: NavSection[] = [
  {
    title: 'Tableau de bord',
    icon: DashboardOutlined,
    items: [
      { to: '/', icon: DashboardOutlined, label: 'Tableau de bord', end: true },
    ],
  },
  {
    title: 'Tickets',
    icon: ConfirmationNumberOutlined,
    items: [
      { to: '/tickets', icon: ConfirmationNumberOutlined, label: 'Liste', end: true },
      { to: '/tickets/kanban', icon: ViewKanbanOutlined, label: 'Kanban' },
    ],
  },
  {
    title: 'Projets',
    icon: AccountTreeOutlined,
    items: [
      { to: '/projects', icon: AccountTreeOutlined, label: 'Projets' },
    ],
  },
  {
    title: 'Ressources',
    icon: AssessmentOutlined,
    items: [
      { to: '/time-tracking', icon: AccessTimeOutlined, label: 'Pointage' },
      { to: '/invoices', icon: ReceiptOutlined, label: 'Factures' },
    ],
  },
]

function isSectionActive(section: NavSection, pathname: string): boolean {
  return section.items.some((item) => isItemActive(item, pathname))
}

function isItemActive(item: NavItem, pathname: string): boolean {
  if (item.end) return pathname === item.to
  return pathname === item.to || pathname.startsWith(item.to + '/')
}

const ITEM_SX = {
  height: '34px',
  display: 'flex',
  alignItems: 'center',
  gap: '9px',
  px: '10px',
  borderRadius: '8px',
  cursor: 'pointer',
  transition: 'background 0.12s, color 0.12s',
  userSelect: 'none',
} as const

const Divider = () => (
  <Box sx={{ height: '1px', mx: '6px', my: '5px', background: 'var(--border)', opacity: 0.6 }} />
)

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { isOpen, isMobile, close } = useSidebar()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const isAdmin = user?.role === 'Admin'
  const isDeveloper = user?.role === 'Developer'
  const filteredSections = useMemo(
    () =>
      navSections
        .map((section) => {
          if (section.title === 'Temps & Facturation') {
            const items = isDeveloper
              ? section.items.filter((i) => i.to !== '/invoices')
              : section.items
            return { ...section, title: section.title, items }
          }
          return section
        })
        .filter((s) => s.items.length > 0),
    [isDeveloper],
  )

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {}
    for (const s of filteredSections) {
      if (s.items.length > 1) init[s.title] = isSectionActive(s, location.pathname)
    }
    return init
  })

  useEffect(() => {
    if (isMobile) close()
  }, [location.pathname, isMobile, close])

  useEffect(() => {
    if (isMobile && isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isMobile, isOpen])

  useEffect(() => {
    for (const s of filteredSections) {
      if (s.items.length > 1 && isSectionActive(s, location.pathname)) {
        setOpenGroups((prev) => prev[s.title] ? prev : { ...prev, [s.title]: true })
      }
    }
  }, [location.pathname, filteredSections])

  if (isMobile && !isOpen) return null

  const toggleGroup = (title: string) =>
    setOpenGroups((prev) => ({ ...prev, [title]: !prev[title] }))

  return (
    <>
      {isMobile && (
        <Box
          onClick={close}
          sx={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 199, backdropFilter: 'blur(2px)' }}
        />
      )}

      <Box
        sx={{
          width: '220px',
          flexShrink: 0,
          height: '100vh',
          background: 'var(--s1)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          position: isMobile ? 'fixed' : 'relative',
          left: 0, top: 0,
          zIndex: isMobile ? 200 : 'auto',
          overflowY: 'auto',
          overflowX: 'hidden',
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >

        {/* ── Logo ─────────────────────────────────────────── */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            px: '14px',
            height: '56px',
            flexShrink: 0,
            borderBottom: '1px solid var(--border)',
          }}
        >
          <SentinelLogo />
          <Box>
            <Box sx={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text)', lineHeight: 1 }}>
              SENTINEL
            </Box>
            <Box sx={{ fontSize: '9px', color: 'var(--muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase', mt: '3px' }}>
              workspace
            </Box>
          </Box>
        </Box>

        {/* ── Nav ──────────────────────────────────────────── */}
        <Box component="nav" sx={{ flex: 1, p: '8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {filteredSections.map((section, si) => {
            const isMulti = section.items.length > 1
            const isGroupOpen = openGroups[section.title] ?? false
            const sectionActive = isSectionActive(section, location.pathname)
            const GroupIcon = section.icon

            return (
              <React.Fragment key={section.title}>
                {si > 0 && <Divider />}

                {isMulti ? (
                  <>
                    {/* Trigger */}
                    <Box
                      component="button"
                      onClick={() => toggleGroup(section.title)}
                      sx={{
                        all: 'unset',
                        ...ITEM_SX,
                        width: '100%',
                        boxSizing: 'border-box',
                        color: sectionActive ? 'var(--text)' : 'var(--text-secondary)',
                        '&:hover .nav-label': !sectionActive ? { color: 'var(--text)' } : {},
                      }}
                    >
                      <GroupIcon sx={{ fontSize: 16, color: sectionActive ? 'var(--accent)' : 'var(--muted)', flexShrink: 0, transition: 'color 0.12s' }} />
                      <Box component="span" className="nav-label" sx={{ flex: 1, fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: sectionActive ? 'var(--text)' : 'var(--muted2)', transition: 'color 0.15s' }}>
                        {section.title}
                      </Box>
                      <ChevronRightOutlined
                        sx={{
                          fontSize: 14,
                          color: 'var(--muted)',
                          flexShrink: 0,
                          transform: isGroupOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                          transition: 'transform 0.18s cubic-bezier(0.4,0,0.2,1)',
                        }}
                      />
                    </Box>

                    {/* Children */}
                    <Box
                      sx={{
                        overflow: 'hidden',
                        maxHeight: isGroupOpen ? `${section.items.length * 32}px` : '0px',
                        ml: '15px',
                        borderLeft: `2px solid ${sectionActive ? 'var(--accent-border)' : 'var(--border)'}`,
                        transition: 'max-height 0.2s cubic-bezier(0.4,0,0.2,1), border-color 0.2s',
                      }}
                    >
                      {section.items.map((item) => {
                        const active = isItemActive(item, location.pathname)
                        return (
                          <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end ?? false}
                            className="d-block text-decoration-none"
                          >
                            <Box
                              sx={{
                                height: '28px',
                                display: 'flex',
                                alignItems: 'center',
                                pl: '12px',
                                pr: '8px',
                                mx: '4px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                background: 'transparent',
                                '&:hover .nav-label': !active ? { color: 'var(--text)' } : {},
                              }}
                            >
                              <Box component="span" className="nav-label" sx={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '10px', fontWeight: active ? 700 : 500, letterSpacing: '0.1em', textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: active ? 'var(--accent)' : 'var(--muted)', transition: 'color 0.15s' }}>
                                {item.label}
                              </Box>
                            </Box>
                          </NavLink>
                        )
                      })}
                    </Box>
                  </>
                ) : (
                  <NavLink
                    to={section.items[0].to}
                    end={section.items[0].end ?? false}
                    className="d-block text-decoration-none"
                  >
                    {({ isActive }) => {
                      const Icon = section.items[0].icon
                      return (
                        <Box
                          sx={{
                            ...ITEM_SX,
                            background: 'transparent',
                            color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                            '&:hover .nav-label': !isActive ? { color: 'var(--text)' } : {},
                          }}
                        >
                          <Icon sx={{ fontSize: 16, flexShrink: 0, color: isActive ? 'var(--accent)' : 'var(--muted)', transition: 'color 0.12s' }} />
                          <Box component="span" className="nav-label" sx={{ fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: isActive ? 'var(--text)' : 'var(--muted2)', transition: 'color 0.15s' }}>
                            {section.items[0].label}
                          </Box>
                        </Box>
                      )
                    }}
                  </NavLink>
                )}
              </React.Fragment>
            )
          })}
        </Box>

        {/* ── Footer ───────────────────────────────────────── */}
        <Box
          sx={{
            flexShrink: 0,
            borderTop: '1px solid var(--border)',
            px: '10px',
            py: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {/* Profil (avatar + nom) */}
          <Box
            component="button"
            onClick={() => navigate('/profile')}
            sx={{
              all: 'unset',
              cursor: 'pointer',
              flex: 1,
              minWidth: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              overflow: 'hidden',
              transition: 'opacity 0.12s',
              '&:hover': { opacity: 0.7 },
            }}
          >
            <Box
              sx={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                background: 'var(--s3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--muted)',
                flexShrink: 0,
              }}
            >
              <PersonOutlined sx={{ fontSize: 18 }} />
            </Box>
            <Box sx={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.firstName} {user?.lastName}
            </Box>
          </Box>

          {/* Actions */}
          {isAdmin && (
            <Box
              component="button"
              onClick={() => navigate('/settings')}
              title="Paramètres"
              sx={{
                all: 'unset',
                cursor: 'pointer',
                width: 26,
                height: 26,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '6px',
                color: 'var(--muted)',
                flexShrink: 0,
                transition: 'color 0.12s, background 0.12s',
                '&:hover': { color: 'var(--accent)', background: 'var(--accent-subtle)' },
              }}
            >
              <SettingsOutlined sx={{ fontSize: 14 }} />
            </Box>
          )}
          <Box
            component="button"
            onClick={handleLogout}
            title="Déconnexion"
            sx={{
              all: 'unset',
              cursor: 'pointer',
              width: 26,
              height: 26,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '6px',
              color: 'var(--muted)',
              flexShrink: 0,
              transition: 'color 0.12s, background 0.12s',
              '&:hover': { color: '#ef4444', background: 'rgba(239,68,68,0.08)' },
            }}
          >
            <LogoutOutlined sx={{ fontSize: 14 }} />
          </Box>
        </Box>

      </Box>
    </>
  )
}
