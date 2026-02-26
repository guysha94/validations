"use client";

import {
  EllipsisVertical,
  LogOut,
  Logs,
  Settings,
  UserCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "~/components/ui/sidebar";
import { useAuth } from "~/hooks";
import { authClient } from "~/lib/auth/client";
import { SIGN_OUT_ROUTE } from "~/lib/constants";

export default function NavUser() {
  const router = useRouter();
  const { user, activeTeam, organization, organizationRole } = useAuth();
  const { isMobile } = useSidebar();

  const hasMultipleTeams = useMemo(
    () => !!organization?.teams?.length,
    [organization],
  );

  const switchTeam = useCallback(
    async (teamId: string) => {
      if (teamId === activeTeam?.id) return;
      const res = await authClient.organization.setActiveTeam({
        teamId,
      });
      if (res.error) return;
      router.refresh();
    },
    [activeTeam?.id, router],
  );

  const userInitials = useMemo(() => {
    if (!user?.name?.length) return "?";
    return user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }, [user]);

  if (!user) return null;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-pointer"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage
                  src={user.image ?? undefined}
                  alt={user.name ?? undefined}
                />
                <AvatarFallback className="rounded-lg">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {user.name ?? "User"}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {user.email}
                </span>
              </div>
              <EllipsisVertical className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal cursor-pointer">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage
                    src={user.image ?? undefined}
                    alt={user.name ?? undefined}
                  />
                  <AvatarFallback className="rounded-lg">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 min-w-0 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
                    {user.name ?? "User"}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {hasMultipleTeams && (
              <>
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Switch team
                </DropdownMenuLabel>
                <div
                  className="px-2 py-1.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Select
                    value={activeTeam?.id ?? ""}
                    onValueChange={switchTeam}
                  >
                    <SelectTrigger className="h-8 w-full text-left">
                      <SelectValue placeholder="Select team" />
                    </SelectTrigger>
                    <SelectContent>
                      {organization?.teams?.map((team) => (
                        <SelectItem
                          key={team.id}
                          value={team.id}
                          className="cursor-pointer"
                        >
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuGroup>
              <Link href="/account/settings" className="cursor-pointer">
                <DropdownMenuItem className="cursor-pointer">
                  <UserCircle />
                  Account
                </DropdownMenuItem>
              </Link>

              {["admin", "owner"].includes(
                (organizationRole || "").toLowerCase(),
              ) && (
                <Link href="/organization/settings" className="cursor-pointer">
                  <DropdownMenuItem className="cursor-pointer">
                    <Settings />
                    Settings
                  </DropdownMenuItem>
                </Link>
              )}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <Link
              href={`/${activeTeam?.slug}/audits`}
              className="cursor-pointer"
            >
              <DropdownMenuItem className="cursor-pointer">
                <Logs />
                Audit logs
              </DropdownMenuItem>
            </Link>
            <Link href={SIGN_OUT_ROUTE}>
              <DropdownMenuItem className="cursor-pointer">
                <LogOut />
                Log out
              </DropdownMenuItem>
            </Link>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
