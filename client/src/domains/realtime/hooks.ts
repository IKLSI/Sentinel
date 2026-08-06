import { useEffect } from "react";
import { queryClient } from "@/configs/queryClient";
import { createRealtimeConnection } from "@/configs/realtime";
import { invalidateKeys } from "@/domains/helpers";
import {
  REALTIME_RETRY_BASE_DELAY_MS,
  REALTIME_RETRY_MAX_DELAY_MS,
  resolveInvalidatedKeys,
} from "@/domains/realtime/constants";
import { REALTIME_INVALIDATE_METHOD } from "@/domains/realtime/contract.gen";
import type { RealtimeEvent } from "@/domains/realtime/types";
import { useAuth } from "@/hooks/useAuth";

export const useRealtimeSync = () => {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;

    const connection = createRealtimeConnection();
    let disposed = false;
    let failedAttempts = 0;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const scheduleRetry = () => {
      if (disposed) return;

      const delay = Math.min(
        REALTIME_RETRY_BASE_DELAY_MS * 2 ** failedAttempts,
        REALTIME_RETRY_MAX_DELAY_MS,
      );
      failedAttempts += 1;
      retryTimer = setTimeout(start, delay);
    };

    const synchronize = () => {
      failedAttempts = 0;
      queryClient.invalidateQueries();
    };

    function start() {
      connection.start().then(synchronize).catch(scheduleRetry);
    }

    connection.on(REALTIME_INVALIDATE_METHOD, (event: RealtimeEvent) =>
      invalidateKeys(resolveInvalidatedKeys(event)),
    );
    connection.onreconnected(synchronize);
    connection.onclose(scheduleRetry);

    start();

    return () => {
      disposed = true;
      if (retryTimer) clearTimeout(retryTimer);
      connection.stop();
    };
  }, [isAuthenticated]);
};
