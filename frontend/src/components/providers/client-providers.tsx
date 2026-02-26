import { NuqsAdapter } from "nuqs/adapters/next";
import type { PropsWithChildren } from "react";
import AuthProvider from "~/components/providers/auth-provider";
import { TooltipProvider } from "~/components/ui/tooltip";
import { AuthContextProvider } from "~/contexts";
import QueryProvider from "./query-provider";
import StoreProvider from "./store-provider";

export function ClientProviders({ children }: PropsWithChildren) {
  return (
    <QueryProvider>
      <NuqsAdapter>
        <StoreProvider>
          <TooltipProvider>
            <AuthProvider>
              <AuthContextProvider>{children}</AuthContextProvider>
            </AuthProvider>
          </TooltipProvider>
        </StoreProvider>
      </NuqsAdapter>
    </QueryProvider>
  );
}

export default ClientProviders;
