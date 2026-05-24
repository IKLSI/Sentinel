import { useCallback, useEffect, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  NotificationItem,
} from './api'

const NOTIFICATIONS_QUERY_KEY = ['notifications'] as const

export function useNotifications() {
  const queryClient = useQueryClient()

  const { data } = useQuery({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    queryFn: fetchNotifications,
    refetchInterval: 30_000,
    staleTime: 15_000,
  })

  const items: NotificationItem[] = data?.items ?? []
  const unreadCount = data?.unreadCount ?? 0
  const unreadTicketIds = new Set(
    items.filter((n) => !n.isRead && n.ticketId).map((n) => n.ticketId!)
  )

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

  return { items, unreadCount, unreadTicketIds, markReadByTicketId, markAllRead: markAllRead.mutate }
}
