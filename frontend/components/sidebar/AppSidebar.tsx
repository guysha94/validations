"use client"

import * as React from "react"
import {ComponentProps, useMemo} from "react"
import * as Icons from "lucide-react";
import {BadgeQuestionMark, type LucideIcon, SearchCode} from "lucide-react";
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
import {useLiveQuery} from "@tanstack/react-db";
import {eventsCollection} from "~/db/collections";
import {SideBarItem} from "~/domain";
import {Skeleton} from "@/components/ui/skeleton"


type AppSidebarProps = ComponentProps<typeof Sidebar> & { session: any };

export function AppSidebar({session, ...props}: AppSidebarProps) {

    const {data: events = [], isLoading} = useLiveQuery(
        (q) => q.from({event: eventsCollection})
            .select(({event}) => ({
                id: event.id,
                type: event.type,
                icon: event.icon,
                label: event.label
            }))
            .orderBy(({event}) => event.type, 'asc'),
    );

    const items = useMemo(() => {

        return events.map((event) => ({
            id: event.id,
            type: event.type,
            title: event.label,
            url: `/validations/${event.type}`.toLowerCase(),
            icon: (Icons[event.icon as keyof typeof Icons] || BadgeQuestionMark) as LucideIcon,
        })) as SideBarItem[];

    }, [events]);

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
                                <span className="text-base font-semibold">Validations</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                {isLoading ?
                    (
                        <Skeleton className="h-4 w-[250px]"/>
                    )
                    :
                    (
                        <NavMain items={items}/>
                    )}

            </SidebarContent>
            <SidebarFooter>
                <NavUser user={session?.user}/>
            </SidebarFooter>
        </Sidebar>
    )
}
