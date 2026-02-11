"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "~/lib/utils";
import { Users, Settings, UserCircle, UsersRound } from "lucide-react";

const links = [
  { href: "/account", label: "Account", icon: UserCircle },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function SettingsNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();

  return (
    <nav className="border-b bg-muted/30 px-6 py-3">
      <ul className="flex flex-wrap items-center gap-1">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "cursor-pointer flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            </li>
          );
        })}
        {isAdmin && (
          <>
            <li className="mx-1 h-4 w-px bg-border" aria-hidden />
            <li>
              <Link
                href="/settings/users"
                className={cn(
                  "cursor-pointer flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  pathname === "/settings/users"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Users className="size-4" />
                Members
              </Link>
            </li>
            <li>
              <Link
                href="/settings/teams"
                className={cn(
                  "cursor-pointer flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  pathname === "/settings/teams"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <UsersRound className="size-4" />
                Teams
              </Link>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
}
