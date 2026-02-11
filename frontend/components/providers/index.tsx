import {PropsWithChildren} from "react";
import QueryProvider from "./QueryProvider";
import {dehydrate, HydrationBoundary, QueryClient} from "@tanstack/react-query";
import AppSidebarProvider from "./AppSidebarProvider";
import AuthProvider from "./AuthProvider";
import {Toaster} from "@/components/ui/sonner";
import StoreProvider from "~/components/providers/StoreProvider";
import {getActiveTeam} from "~/lib/actions";


export default async function AppProviders({children}: PropsWithChildren) {

    const queryClient = new QueryClient();
    const team = await getActiveTeam();


    return (
        <QueryProvider>
            <HydrationBoundary state={dehydrate(queryClient)}>
                <StoreProvider>
                    <AuthProvider>
                        <AppSidebarProvider activeTeam={team}>
                            {children}
                        </AppSidebarProvider>
                    </AuthProvider>
                    <Toaster/>
                </StoreProvider>
            </HydrationBoundary>
        </QueryProvider>
    );
}
