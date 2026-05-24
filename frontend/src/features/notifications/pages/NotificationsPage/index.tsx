import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import NotificationsNone from '@mui/icons-material/NotificationsNone'
import CheckOutlined from '@mui/icons-material/CheckOutlined'
import { useT } from '@/i18n/I18nContext'
import { useNotifications } from '../../useNotifications'
import { NotificationItem } from '../../api'

type Filter = 'all' | 'unread' | 'read'

const FILTERS: { key: Filter; labelKey: string }[] = [
  { key: 'all', labelKey: 'notifications.filter.all' },
  { key: 'unread', labelKey: 'notifications.filter.unread' },
  { key: 'read', labelKey: 'notifications.filter.read' },
]

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1) return "à l'instant"
  if (m < 60) return `il y a ${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `il y a ${h}h`
  const d = Math.floor(h / 24)
  return `il y a ${d}j`
}

export const NotificationsPage: React.FC = () => {
  const t = useT()
  const navigate = useNavigate()
  const { items, unreadCount, markReadByTicketId, markAllRead } = useNotifications()
  const [activeFilter, setActiveFilter] = useState<Filter>('all')

  const filtered =
    activeFilter === 'unread' ? items.filter((n) => !n.isRead) :
    activeFilter === 'read' ? items.filter((n) => n.isRead) :
    items

  const handleClick = (notif: NotificationItem) => {
    if (!notif.isRead && notif.ticketId) markReadByTicketId(notif.ticketId)
    if (notif.ticketId) navigate(`/tickets/${notif.ticketId}`)
  }

  return (
    <Box
      className="page-enter"
      sx={{ p: '20px 28px', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: '20px', flexShrink: 0 }}>
        <Box>
          <Box sx={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>
            {t('notifications.title')}
          </Box>
          {unreadCount > 0 && (
            <Box sx={{ fontSize: '11px', color: 'var(--muted)', mt: '2px' }}>
              {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
            </Box>
          )}
        </Box>
        {unreadCount > 0 && (
          <Box
            component="button"
            onClick={() => markAllRead(undefined)}
            sx={{
              all: 'unset',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              px: '10px',
              py: '6px',
              borderRadius: 'var(--r)',
              border: '1px solid var(--border)',
              fontSize: '11px',
              color: 'var(--muted)',
              transition: 'color 0.12s, border-color 0.12s',
              '&:hover': { color: 'var(--text)', borderColor: 'var(--accent)' },
            }}
          >
            <CheckOutlined sx={{ fontSize: 13 }} />
            {t('notifications.mark_all_read')}
          </Box>
        )}
      </Box>

      <Box sx={{ display: 'flex', gap: '4px', mb: '16px', flexShrink: 0, flexWrap: 'wrap' }}>
        {FILTERS.map(({ key, labelKey }) => {
          const isActive = activeFilter === key
          return (
            <Box
              key={key}
              component="button"
              onClick={() => setActiveFilter(key)}
              sx={{
                all: 'unset',
                cursor: 'pointer',
                px: '10px',
                py: '5px',
                borderRadius: 'var(--r)',
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: isActive ? 'var(--accent)' : 'var(--muted)',
                background: isActive ? 'var(--accent-subtle)' : 'transparent',
                border: '1px solid',
                borderColor: isActive ? 'var(--accent-border, var(--accent))' : 'var(--border)',
                transition: 'all 0.12s',
                '&:hover': !isActive ? { color: 'var(--text)', borderColor: 'var(--border-hover, var(--muted2))' } : {},
              }}
            >
              {t(labelKey)}
            </Box>
          )
        })}
      </Box>

      <Box
        sx={{
          flex: 1,
          background: 'var(--s1)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {filtered.length === 0 ? (
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Box className="empty-state">
              <Box className="empty-state-icon">
                <NotificationsNone sx={{ fontSize: 40 }} />
              </Box>
              <Box className="empty-state-title">{t('notifications.empty')}</Box>
            </Box>
          </Box>
        ) : (
          <Box sx={{ overflowY: 'auto', flex: 1 }}>
            {filtered.map((notif, idx) => (
              <Box
                key={notif.id}
                component={notif.ticketId ? 'button' : 'div'}
                onClick={() => notif.ticketId && handleClick(notif)}
                sx={{
                  all: notif.ticketId ? 'unset' : undefined,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  width: '100%',
                  boxSizing: 'border-box',
                  px: '18px',
                  py: '14px',
                  cursor: notif.ticketId ? 'pointer' : 'default',
                  borderBottom: idx < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                  background: notif.isRead ? 'transparent' : 'var(--accent-subtle)',
                  transition: 'background 0.12s',
                  '&:hover': notif.ticketId ? { background: 'var(--s2)' } : {},
                }}
              >
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: notif.isRead ? 'transparent' : 'var(--accent)',
                    border: notif.isRead ? '1.5px solid var(--border2)' : 'none',
                    flexShrink: 0,
                    mt: '5px',
                  }}
                />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box
                    sx={{
                      fontSize: '13px',
                      fontWeight: notif.isRead ? 400 : 600,
                      color: notif.isRead ? 'var(--text-secondary)' : 'var(--text)',
                      lineHeight: 1.45,
                      wordBreak: 'break-word',
                    }}
                  >
                    {notif.message}
                  </Box>
                  <Box sx={{ mt: '4px' }}>
                    <Box sx={{ fontSize: '10px', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
                      {timeAgo(notif.createdAt)}
                    </Box>
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  )
}
