import {PropsWithChildren} from "react";
import AuthProvider from "./AuthProvider";

import QueryProvider from './QueryProvider';
import {dehydrate, HydrationBoundary, QueryClient,} from '@tanstack/react-query'
import AppSidebarProvider from "./AppSidebarProvider";
import { Toaster } from "@/components/ui/sonner"

export default async function AppProviders({children}: PropsWithChildren) {
    // const session = await getServerSession(authOptions);
    const queryClient = new QueryClient();
    return (
        <QueryProvider>
            <AuthProvider >
                <HydrationBoundary state={dehydrate(queryClient)}>
                    <AppSidebarProvider >
                        {children}
                        <Toaster />
                    </AppSidebarProvider>
                </HydrationBoundary>
            </AuthProvider>
        </QueryProvider>
    );
}
