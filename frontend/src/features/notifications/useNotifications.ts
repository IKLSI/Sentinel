import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  NotificationItem,
  NotificationsResponse,
} from './api'
import { useNotificationHub } from './useNotificationHub'

const NOTIFICATIONS_QUERY_KEY = ['notifications'] as const

export function useNotifications() {
  const queryClient = useQueryClient()

  const { data } = useQuery({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    queryFn: fetchNotifications,
  })

  useNotificationHub((incoming) => {
    queryClient.setQueryData<NotificationsResponse>(NOTIFICATIONS_QUERY_KEY, (prev) => {
      const items = prev?.items ?? []
      return {
        items: [incoming, ...items],
        unreadCount: (prev?.unreadCount ?? 0) + 1,
      }
    })
  })

  const items: NotificationItem[] = useMemo(() => data?.items ?? [], [data])
  const unreadCount = data?.unreadCount ?? 0

  const markRead = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY }),
  })

  const markAllRead = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY }),
  })

  const itemsRef = useRef(items)
  useEffect(() => { itemsRef.current = items })

  const markReadByTicketId = useCallback((ticketId: string) => {
    const notif = itemsRef.current.find((n) => !n.isRead && n.ticketId === ticketId)
    if (notif) markRead.mutate(notif.id)
  }, [markRead.mutate]) // eslint-disable-line react-hooks/exhaustive-deps

  return { items, unreadCount, markReadByTicketId, markAllRead: markAllRead.mutate }
}
