"use client"
import {CSSProperties, PropsWithChildren} from "react";
import {SidebarInset, SidebarProvider} from "@/components/ui/sidebar"

import SiteHeader from "~/components/sidebar/SiteHeader";

import dynamic from "next/dynamic";

const AppSidebar = dynamic(
    () =>
        import("~/components/sidebar/AppSidebar").then((mod) => ({
            default: mod.AppSidebar,
        })),
    {
        ssr: false,
        loading: () => <div>Loading...</div>,
    }
);

type AuthProviderProps = {
    session?: any | null | undefined
}

export default function AppSidebarProvider({session, children}: PropsWithChildren<AuthProviderProps>) {

    // if (!session) {
    //     return <>{children}</>
    // }

    return (
        <SidebarProvider
            style={
                {
                    "--sidebar-width": "calc(var(--spacing) * 72)",
                    "--header-height": "calc(var(--spacing) * 12)",
                } as CSSProperties
            }
        >
            <AppSidebar variant="inset" session={session}/>
            <SidebarInset>
                <SiteHeader/>
                {children}
            </SidebarInset>
        </SidebarProvider>

    )
}
