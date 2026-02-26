"use client";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ReactQueryStreamedHydration } from "@tanstack/react-query-next-experimental";
import type { PropsWithChildren } from "react";
import env from "~/lib/env";
import { getQueryClient } from "~/lib/query-client";

export default function QueryProvider({ children }: PropsWithChildren) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <ReactQueryStreamedHydration>
        {children}

        {env.NEXT_PUBLIC_IS_DEV && (
          <ReactQueryDevtools initialIsOpen client={queryClient} />
        )}
      </ReactQueryStreamedHydration>
    </QueryClientProvider>
  );
}
