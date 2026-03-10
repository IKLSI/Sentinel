import React, { createContext, useState, useEffect, useCallback, useRef, useContext } from 'react'
import * as signalR from '@microsoft/signalr'
import { Notification } from '../../../types'
import { getNotifications, markAsRead as apiMarkAsRead, markAllAsRead as apiMarkAllAsRead } from '../api/notifications'
import { createNotificationHub } from '../../../services/notificationHub'
import { AuthContext } from '../../auth/context/AuthContext'

interface NotificationContextValue {
  notifications: Notification[]
  unreadCount: number
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  loading: boolean
}

export const NotificationContext = createContext<NotificationContextValue>({
  notifications: [],
  unreadCount: 0,
  markAsRead: () => {},
  markAllAsRead: () => {},
  loading: false,
})

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading: authLoading } = useContext(AuthContext)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const connectionRef = useRef<signalR.HubConnection | null>(null)

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const response = await getNotifications({ pageSize: 50 })
      setNotifications(response?.items || [])
    } catch {
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (authLoading || !isAuthenticated) return

    const token = localStorage.getItem('accessToken')
    if (!token) return

    fetchNotifications()

    const connection = createNotificationHub(token)
    connection.on('ReceiveNotification', (notification: Notification) => {
      setNotifications((prev) => [notification, ...prev])
    })
    connection.start().catch(() => {})
    connectionRef.current = connection

    return () => { connection.stop() }
  }, [authLoading, isAuthenticated, fetchNotifications])

  const markAsRead = useCallback(async (id: string) => {
    await apiMarkAsRead(id)
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)))
  }, [])

  const markAllAsRead = useCallback(async () => {
    await apiMarkAllAsRead()
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
  }, [])

  const unreadCount = notifications.filter((n) => !n.isRead).length

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, loading }}>
      {children}
    </NotificationContext.Provider>
  )
}
