import { QueryClient } from "@tanstack/react-query";

const FALLBACK_STALE_TIME_MS = 5 * 60_000;

const GC_TIME_MS = 5 * 60_000;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: FALLBACK_STALE_TIME_MS,
      gcTime: GC_TIME_MS,
      refetchOnWindowFocus: false,
      refetchOnReconnect: "always",
      retry: 1,
    },
    mutations: {
      retry: 0,
    },
  },
});
