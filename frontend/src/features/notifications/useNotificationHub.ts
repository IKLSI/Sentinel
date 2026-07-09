import { useEffect, useRef } from "react";
import {
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";
import { STORAGE_KEYS } from "@/constants/storage";
import type { NotificationItem } from "./api";

export function useNotificationHub(
  onNotification: (n: NotificationItem) => void,
) {
  const onNotificationRef = useRef(onNotification);
  useEffect(() => {
    onNotificationRef.current = onNotification;
  });

  useEffect(() => {
    const connection = new HubConnectionBuilder()
      .withUrl("/hubs/notifications", {
        accessTokenFactory: () =>
          localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) ?? "",
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    connection.on("ReceiveNotification", (n: NotificationItem) => {
      onNotificationRef.current(n);
    });

    connection.start().catch(() => {});

    return () => {
      if (connection.state !== HubConnectionState.Disconnected) {
        connection.stop().catch(() => {});
      }
    };
  }, []);
}
