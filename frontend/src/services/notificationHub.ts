import * as signalR from '@microsoft/signalr'

export function createNotificationHub(token: string): signalR.HubConnection {
  return new signalR.HubConnectionBuilder()
    .withUrl(
      `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/hubs/notifications`,
      { accessTokenFactory: () => token }
    )
    .withAutomaticReconnect()
    .configureLogging(signalR.LogLevel.None)
    .build()
}
