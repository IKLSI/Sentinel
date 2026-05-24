import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import NotificationsOutlined from '@mui/icons-material/NotificationsOutlined'
import Box from '@mui/material/Box'
import Tooltip from '@mui/material/Tooltip'
import Popover from '@mui/material/Popover'
import { useT } from '../../i18n/I18nContext'
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  NotificationItem,
} from './api'

const POLL_INTERVAL = 30_000

export const NotificationBell: React.FC<{ collapsed?: boolean }> = ({ collapsed = false }) => {
  const t = useT()
  const navigate = useNavigate()
  const [items, setItems] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const load = useCallback(async () => {
    try {
      const data = await fetchNotifications()
      setItems(data.items)
      setUnreadCount(data.unreadCount)
    } catch {
      // silent — notifs non critiques
    }
  }, [])

  useEffect(() => {
    load()
    intervalRef.current = setInterval(load, POLL_INTERVAL)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [load])

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(e.currentTarget)
  }

  const handleClose = () => setAnchorEl(null)

  const handleClickNotification = async (notif: NotificationItem) => {
    if (!notif.isRead) {
      await markNotificationRead(notif.id)
      setItems((prev) => prev.map((n) => n.id === notif.id ? { ...n, isRead: true } : n))
      setUnreadCount((prev) => Math.max(0, prev - 1))
    }
    handleClose()
    if (notif.ticketId) navigate(`/tickets/${notif.ticketId}`)
  }

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead()
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })))
    setUnreadCount(0)
  }

  const open = Boolean(anchorEl)

  return (
    <>
      <Tooltip title={t('notifications.tooltip')} placement={collapsed ? 'right' : 'top'} arrow>
        <Box
          component="button"
          onClick={handleOpen}
          sx={{
            all: 'unset',
            cursor: 'pointer',
            width: 26,
            height: 26,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 'var(--r-sm)',
            color: open ? 'var(--text)' : 'var(--muted)',
            flexShrink: 0,
            position: 'relative',
            transition: 'color 0.12s, background 0.12s',
            '&:hover': { color: 'var(--text)', background: 'var(--s3)' },
          }}
        >
          <NotificationsOutlined sx={{ fontSize: 14 }} />
          {unreadCount > 0 && (
            <Box
              sx={{
                position: 'absolute',
                top: 3,
                right: 3,
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: 'var(--red, #ef4444)',
                border: '1.5px solid var(--s1)',
              }}
            />
          )}
        </Box>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              width: 320,
              maxHeight: 420,
              background: 'var(--s1)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-lg)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            },
          },
        }}
      >
        <Box
          sx={{
            px: '14px',
            py: '10px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <Box sx={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text)' }}>
            {t('notifications.title')}
            {unreadCount > 0 && (
              <Box
                component="span"
                sx={{
                  ml: '6px',
                  px: '5px',
                  py: '1px',
                  borderRadius: '10px',
                  background: 'var(--red, #ef4444)',
                  color: '#fff',
                  fontSize: '9px',
                  fontWeight: 700,
                  verticalAlign: 'middle',
                }}
              >
                {unreadCount}
              </Box>
            )}
          </Box>
          {unreadCount > 0 && (
            <Box
              component="button"
              onClick={handleMarkAllRead}
              sx={{
                all: 'unset',
                cursor: 'pointer',
                fontSize: '9px',
                color: 'var(--accent)',
                letterSpacing: '0.04em',
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              {t('notifications.mark_all_read')}
            </Box>
          )}
        </Box>

        <Box sx={{ overflowY: 'auto', flex: 1 }}>
          {items.length === 0 ? (
            <Box sx={{ px: '14px', py: '24px', textAlign: 'center', fontSize: '11px', color: 'var(--muted)' }}>
              {t('notifications.empty')}
            </Box>
          ) : (
            items.map((notif) => (
              <Box
                key={notif.id}
                component="button"
                onClick={() => handleClickNotification(notif)}
                sx={{
                  all: 'unset',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  width: '100%',
                  boxSizing: 'border-box',
                  px: '14px',
                  py: '10px',
                  cursor: notif.ticketId ? 'pointer' : 'default',
                  borderBottom: '1px solid var(--border)',
                  background: notif.isRead ? 'transparent' : 'var(--accent-subtle)',
                  transition: 'background 0.12s',
                  '&:hover': { background: 'var(--s3)' },
                  '&:last-child': { borderBottom: 'none' },
                }}
              >
                {!notif.isRead && (
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: 'var(--accent)',
                      flexShrink: 0,
                      mt: '4px',
                    }}
                  />
                )}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box
                    sx={{
                      fontSize: '11px',
                      color: 'var(--text)',
                      lineHeight: 1.4,
                      wordBreak: 'break-word',
                      pl: notif.isRead ? '16px' : 0,
                    }}
                  >
                    {notif.message}
                  </Box>
                  <Box sx={{ fontSize: '9px', color: 'var(--muted)', mt: '3px', pl: notif.isRead ? '16px' : 0 }}>
                    {new Date(notif.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </Box>
                </Box>
              </Box>
            ))
          )}
        </Box>
      </Popover>
    </>
  )
}
