import {NuqsAdapter} from "nuqs/adapters/next";
import type {PropsWithChildren} from "react";
import AuthProvider from "~/components/providers/auth-provider";
import {TooltipProvider} from "~/components/ui/tooltip";
import {AuthContextProvider} from "~/contexts";
import QueryProvider from "./query-provider";
import StoreProvider from "./store-provider";
import ThemeProvider from "./theme-provider";
import {EventsContextProvider} from "~/contexts/events-context";


export function ClientProviders({children}: PropsWithChildren) {
    return (
        <QueryProvider>
            <NuqsAdapter>
                <StoreProvider>
                    <EventsContextProvider>
                        <TooltipProvider>
                            <AuthProvider>
                                <AuthContextProvider>
                                    <ThemeProvider
                                        attribute="class"
                                        defaultTheme="system"
                                        enableSystem
                                        disableTransitionOnChange
                                    >
                                        {children}
                                    </ThemeProvider>
                                </AuthContextProvider>
                            </AuthProvider>
                        </TooltipProvider>
                    </EventsContextProvider>
                </StoreProvider>
            </NuqsAdapter>
        </QueryProvider>
    );
}

export default ClientProviders;
