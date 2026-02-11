"use client"

import * as React from "react"
import {ComponentProps} from "react"
import {SearchCode} from "lucide-react";
import NavMain from "./NavMain"
import NavUser from "./NavUser"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import Link from 'next/link'

import {useAuth} from "~/hooks/useAuth";
import {useUserInfoStore} from "~/store";
import {useShallow} from "zustand/react/shallow";


type AppSidebarProps = ComponentProps<typeof Sidebar>;

export function AppSidebar({...props}: AppSidebarProps) {

    const {activeTeam} = useUserInfoStore(useShallow((state) => state));
    const {user, session} = useAuth();


    if (!user) return null;


    return (
        <Sidebar collapsible="offcanvas" {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            className="data-[slot=sidebar-menu-button]:!p-1.5 cursor-pointer"
                        >
                            <Link href="/">
                                <SearchCode/>
                                <span className="text-base font-semibold">{activeTeam?.name}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <NavMain teamId={session?.activeTeamId || ""}/>
            </SidebarContent>
            <SidebarFooter>
                <NavUser/>
            </SidebarFooter>
        </Sidebar>
    )
}
