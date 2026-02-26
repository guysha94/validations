"use client";
import { isServer, QueryClient } from "@tanstack/react-query";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        enabled: true,
        refetchInterval: 60 * 1000,
        refetchOnWindowFocus: true,
        refetchIntervalInBackground: true,
        retry: 3,
        refetchOnMount: "always",
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        experimental_prefetchInRender: false,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

export function getQueryClient() {
  if (isServer) {
    return makeQueryClient();
  } else {
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}
