import { useEffect } from "react";
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

    const connection = createRealtimeConnection();
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

    function start() {
      connection.start().then(onStarted).catch(scheduleRetry);
    }

    connection.on(REALTIME_INVALIDATE_METHOD, (event: RealtimeEvent) => {
      batcher.enqueue(resolveInvalidatedKeys(event));
      if (event.resource === REALTIME_RESOURCES.Users) refreshUser();
    });
    connection.onreconnected(resynchronize);
    connection.onclose(scheduleRetry);

    start();

    return () => {
      disposed = true;
      batcher.clear();
      if (retryTimer) clearTimeout(retryTimer);
      connection.stop();
    };
  }, [isAuthenticated, refreshUser]);
};
