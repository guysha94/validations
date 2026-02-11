"use client";

import {type CSSProperties, type PropsWithChildren, useEffect} from "react";
import {SidebarInset, SidebarProvider} from "@/components/ui/sidebar";
import SiteHeader from "~/components/sidebar/SiteHeader";
import {AppSidebar} from "~/components/sidebar";
import {usePathname} from 'next/navigation'
import {useUserInfoStore, useValidationsStore} from "~/store";
import {useShallow} from "zustand/react/shallow";
import {useAuth} from "~/hooks/useAuth";
import {SelectTeam} from "~/domain";
import {ROOT_ROUTE, SIGN_IN_ROUTE, SIGN_OUT_ROUTE} from "~/lib/constants";


type Props = {
    activeTeam: SelectTeam
}

const dontDisplaySidebarRoutes = [SIGN_IN_ROUTE, SIGN_OUT_ROUTE];

export default function AppSidebarProvider({activeTeam, children}: PropsWithChildren<Props>) {
    const pathname = usePathname();
    const {session} = useAuth();
    const {setCurrentEvent} = useValidationsStore(useShallow((state) => state));
    const {activeTeam: clientActiveTeam, setActiveTeam} = useUserInfoStore(useShallow((state) => state));
    useEffect(() => {
        if (pathname === ROOT_ROUTE) {
            setCurrentEvent(null);
            return;
        }

    }, [pathname, setCurrentEvent]);

    useEffect(() => {
        if (!activeTeam) {
            setActiveTeam(null);
            setCurrentEvent(null);
        } else if (clientActiveTeam?.id !== activeTeam?.id) {
            setActiveTeam(activeTeam);
        }
    }, [activeTeam, clientActiveTeam, setActiveTeam, setCurrentEvent]);

    if (!session || dontDisplaySidebarRoutes.some((route) => pathname?.includes(route))) {
        return <>{children}</>;
    }


    return (
        <SidebarProvider
            style={
                {
                    "--sidebar-width": "calc(var(--spacing) * 72)",
                    "--header-height": "calc(var(--spacing) * 12)",
                } as CSSProperties
            }
        >
            <AppSidebar variant="inset"/>
            <SidebarInset>
                <SiteHeader/>
                {children}
            </SidebarInset>
        </SidebarProvider>
    );
}
