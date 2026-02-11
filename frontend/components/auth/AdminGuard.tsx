"use server";

import { type PropsWithChildren } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";

/**
 * Wraps content that only admin users can access. Redirects non-admins to /settings.
 */
export async function AdminGuard({ children }: PropsWithChildren) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return redirect("/sign-in");
  if (session.user.role !== "admin") return redirect("/settings");
  return <>{children}</>;
}
