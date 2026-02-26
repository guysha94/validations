import { SearchCode } from "lucide-react";
import Link from "next/link";
import type { ComponentProps } from "react";
import { getActiveTeam } from "~/actions";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "~/components/ui/sidebar";
import { EventsContextProvider } from "~/contexts/events-context";
import NavMain from "./NavMain";
import NavUser from "./NavUser";

type Props = ComponentProps<typeof Sidebar>;

export async function AppSidebar({ ...props }: Props) {
  const { data: team, error } = await getActiveTeam();

  if (error) {
    console.error("Error fetching active team:", error);
    return null;
  }
  if (!team) {
    return null;
  }

  return (
    <EventsContextProvider teamSlug={team.slug || ""}>
      <Sidebar collapsible="offcanvas" {...props}>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                className="data-[slot=sidebar-menu-button]:!p-1.5 cursor-pointer"
              >
                <Link href={`/${team.slug}`}>
                  <SearchCode />
                  <span className="text-base font-semibold">{team.name}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <NavMain />
        </SidebarContent>
        <SidebarFooter>
          <NavUser />
        </SidebarFooter>
      </Sidebar>
    </EventsContextProvider>
  );
}
