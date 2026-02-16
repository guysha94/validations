import {PropsWithChildren, Suspense} from "react";
import QueryProvider from "./QueryProvider";
import {dehydrate, HydrationBoundary, QueryClient} from "@tanstack/react-query";
import AppSidebarProvider from "./AppSidebarProvider";
import AuthProvider from "./AuthProvider";
import {Toaster} from "@/components/ui/sonner";
import StoreProvider from "~/components/providers/StoreProvider";
import {getActiveTeam} from "~/lib/actions";

async function AppSidebarWithTeam({children}: PropsWithChildren) {
    const team = await getActiveTeam();
    return <AppSidebarProvider activeTeam={team}>{children}</AppSidebarProvider>;
}

export default function AppProviders({children}: PropsWithChildren) {
    const queryClient = new QueryClient();

    return (
        <QueryProvider>
            <HydrationBoundary state={dehydrate(queryClient)}>
                <Suspense fallback={<>{children}</>}>
                    <StoreProvider>
                        <AuthProvider>
                            <Suspense fallback={<>{children}</>}>
                                <AppSidebarWithTeam>{children}</AppSidebarWithTeam>
                            </Suspense>
                        </AuthProvider>
                        <Toaster/>
                    </StoreProvider>
                </Suspense>
            </HydrationBoundary>
        </QueryProvider>
    );
}
