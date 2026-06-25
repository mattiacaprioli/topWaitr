import { QueryClient } from "@tanstack/react-query";

/**
 * Shared TanStack Query client. On React Native there is no window focus, so we
 * rely on refetchOnMount + explicit invalidation after mutations rather than
 * focus refetching. staleTime keeps screens snappy on quick re-entry.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnMount: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
    },
  },
});
