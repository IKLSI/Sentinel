import { useEffect } from "react";
import type { HubConnection } from "@microsoft/signalr";
import { queryClient } from "@/configs/queryClient";
import { createRealtimeConnection } from "@/configs/realtime";
import { invalidateKeys } from "@/domains/helpers";
import { createInvalidationBatcher } from "@/domains/realtime/batcher";
import {
  REALTIME_INVALIDATION_BATCH_MS,
  REALTIME_RETRY_BASE_DELAY_MS,
  REALTIME_RETRY_MAX_DELAY_MS,
  resolveInvalidatedKeys,
} from "@/domains/realtime/constants";
import {
  REALTIME_INVALIDATE_METHOD,
  REALTIME_RESOURCES,
} from "@/domains/realtime/contract.gen";
import type { RealtimeEvent } from "@/domains/realtime/types";
import { useAuth } from "@/hooks/useAuth";

export const useRealtimeSync = () => {
  const { isAuthenticated, refreshUser } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;

    const batcher = createInvalidationBatcher(
      invalidateKeys,
      REALTIME_INVALIDATION_BATCH_MS,
    );
    let disposed = false;
    let hasConnected = false;
    let failedAttempts = 0;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const scheduleRetry = () => {
      batcher.clear();
      if (disposed) return;

      const delay = Math.min(
        REALTIME_RETRY_BASE_DELAY_MS * 2 ** failedAttempts,
        REALTIME_RETRY_MAX_DELAY_MS,
      );
      failedAttempts += 1;
      retryTimer = setTimeout(start, delay);
    };

    const resynchronize = () => {
      failedAttempts = 0;
      queryClient.invalidateQueries(undefined, { cancelRefetch: false });
      refreshUser();
    };

    const onStarted = () => {
      const missedEvents = hasConnected || failedAttempts > 0;
      hasConnected = true;
      if (missedEvents) resynchronize();
    };

    let connecting: Promise<HubConnection> | null = null;

    const connect = () => {
      connecting ??= createRealtimeConnection().then(
        (connection) => {
          connection.on(REALTIME_INVALIDATE_METHOD, (event: RealtimeEvent) => {
            batcher.enqueue(resolveInvalidatedKeys(event));
            if (event.resource === REALTIME_RESOURCES.Users) refreshUser();
          });
          connection.onreconnected(resynchronize);
          connection.onclose(scheduleRetry);
          return connection;
        },
        (error) => {
          connecting = null;
          throw error;
        },
      );
      return connecting;
    };

    function start() {
      connect()
        .then((connection) => {
          if (disposed) return;
          return connection.start().then(onStarted);
        })
        .catch(scheduleRetry);
    }

    start();

    return () => {
      disposed = true;
      batcher.clear();
      if (retryTimer) clearTimeout(retryTimer);
      connecting?.then((connection) => connection.stop()).catch(() => {});
    };
  }, [isAuthenticated, refreshUser]);
};
