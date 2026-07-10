import { useEffect, useRef } from "react";
import {
  type HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";
import { STORAGE_KEYS } from "@/constants/storage";
import type { NotificationItem } from "./api";

const HUB_URL = "/hubs/notifications";
const NOTIFICATION_EVENT = "ReceiveNotification";

let sharedConnection: HubConnection | null = null;
let subscriberCount = 0;
const listeners = new Set<(n: NotificationItem) => void>();

function ensureConnection() {
  if (sharedConnection) return;

  const connection = new HubConnectionBuilder()
    .withUrl(HUB_URL, {
      accessTokenFactory: () =>
        localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) ?? "",
    })
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Warning)
    .build();

  connection.on(NOTIFICATION_EVENT, (n: NotificationItem) => {
    for (const listener of listeners) listener(n);
  });

  connection.start().catch(() => {});
  sharedConnection = connection;
}

function releaseConnection() {
  if (
    sharedConnection &&
    sharedConnection.state !== HubConnectionState.Disconnected
  ) {
    sharedConnection.stop().catch(() => {});
  }
  sharedConnection = null;
}

export function useNotificationHub(
  onNotification: (n: NotificationItem) => void,
) {
  const onNotificationRef = useRef(onNotification);
  useEffect(() => {
    onNotificationRef.current = onNotification;
  });

  useEffect(() => {
    const listener = (n: NotificationItem) => onNotificationRef.current(n);
    listeners.add(listener);
    subscriberCount += 1;
    ensureConnection();

    return () => {
      listeners.delete(listener);
      subscriberCount -= 1;
      if (subscriberCount === 0) releaseConnection();
    };
  }, []);
}
