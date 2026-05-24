import React, { useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import NotificationsNone from '@mui/icons-material/NotificationsNone'
import CheckOutlined from '@mui/icons-material/CheckOutlined'
import { useNavigate } from 'react-router-dom'
import { useT } from '@/i18n/I18nContext'
import { useNotifications } from './useNotifications'
import { NotificationItem } from './api'

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

interface Props {
  open: boolean
  onClose: () => void
}

export const NotificationsModal: React.FC<Props> = ({ open, onClose }) => {
  const t = useT()
  const navigate = useNavigate()
  const { items, unreadCount, markReadByTicketId, markAllRead } = useNotifications()
  const [activeFilter, setActiveFilter] = useState<Filter>('all')

  const counts: Record<Filter, number> = {
    all: items.length,
    unread: items.filter((n) => !n.isRead).length,
    read: items.filter((n) => n.isRead).length,
  }

  const filtered =
    activeFilter === 'unread' ? items.filter((n) => !n.isRead) :
    activeFilter === 'read' ? items.filter((n) => n.isRead) :
    items

  const handleClick = (notif: NotificationItem) => {
    if (!notif.isRead && notif.ticketId) markReadByTicketId(notif.ticketId)
    if (notif.ticketId) {
      onClose()
      navigate(`/tickets/${notif.ticketId}`)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            bgcolor: 'var(--s1)',
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '600px',
          },
        },
      }}
    >
      <Box
        sx={{
          p: '16px 24px',
          borderBottom: '1px solid var(--border)',
          background: 'linear-gradient(135deg, var(--accent-subtle) 0%, var(--s2) 60%)',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box>
          <Box sx={{ fontSize: '14px', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text)' }}>
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

      <Box sx={{ px: '20px', pt: '12px', pb: '8px', flexShrink: 0 }}>
        <Box
          sx={{
            display: 'inline-flex',
            background: 'var(--s2)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r)',
            p: '3px',
            gap: '2px',
          }}
        >
          {FILTERS.map(({ key, labelKey }) => {
            const isActive = activeFilter === key
            const count = counts[key]
            return (
              <Box
                key={key}
                component="button"
                onClick={() => setActiveFilter(key)}
                sx={{
                  all: 'unset',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  px: '10px',
                  py: '5px',
                  borderRadius: 'calc(var(--r) - 2px)',
                  fontSize: '11px',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? 'var(--accent)' : 'var(--muted)',
                  background: isActive ? 'var(--s1)' : 'transparent',
                  boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.10)' : 'none',
                  transition: 'all 0.15s',
                  '&:hover': !isActive ? { color: 'var(--text-secondary)', background: 'var(--s3)' } : {},
                }}
              >
                {t(labelKey)}
                {count > 0 && (
                  <Box
                    component="span"
                    sx={{
                      fontSize: '9px',
                      fontWeight: 700,
                      lineHeight: 1,
                      px: '5px',
                      py: '2px',
                      borderRadius: '10px',
                      background: isActive ? 'var(--accent-subtle)' : 'var(--border)',
                      color: isActive ? 'var(--accent)' : 'var(--muted2)',
                      transition: 'all 0.15s',
                    }}
                  >
                    {count}
                  </Box>
                )}
              </Box>
            )
          })}
        </Box>
      </Box>

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        {filtered.length === 0 ? (
          <Box sx={{ py: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Box className="empty-state">
              <Box className="empty-state-icon">
                <NotificationsNone sx={{ fontSize: 36 }} />
              </Box>
              <Box className="empty-state-title">{t('notifications.empty')}</Box>
            </Box>
          </Box>
        ) : (
          filtered.map((notif, idx) => (
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
                px: '20px',
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
                <Box sx={{ mt: '4px', fontSize: '10px', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
                  {timeAgo(notif.createdAt)}
                </Box>
              </Box>
            </Box>
          ))
        )}
      </Box>

      <Box
        sx={{
          p: '14px 20px',
          borderTop: '1px solid var(--border)',
          background: 'var(--s2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          flexShrink: 0,
        }}
      >
        <Button
          variant="contained"
          size="small"
          className="btn-cancel"
          sx={{ textTransform: 'none' }}
          onClick={onClose}
        >
          {t('notifications.modal.close')}
        </Button>
      </Box>
    </Dialog>
  )
}
