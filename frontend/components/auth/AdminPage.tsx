"use server";

import { type PropsWithChildren } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";

/**
 * Renders children only for admin users. Redirects others to /settings.
 */
export async function AdminPage({ children }: PropsWithChildren) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return redirect("/sign-in");
  if (session.user.role !== "admin") return redirect("/settings");
  return <>{children}</>;
}
