"use server";
import {getSessionCookie as fetchSessionCookie} from "better-auth/cookies";
import {headers as getHeaders, headers} from "next/headers";
import type {NextRequest} from "next/server";
import type {Optional, Session} from "~/domain";
import {auth} from "~/lib/auth/server";

export async function getSessionCookie(
  req?: Optional<NextRequest>,
): Promise<string | null> {
  if (req) return fetchSessionCookie(req);
  const headers = await getHeaders();
  return fetchSessionCookie(headers);
}

export async function isAuthenticated(): Promise<boolean> {
  const session = await getSessionCookie();
  return !!session;
}

export async function getSession(): Promise<Session | null | undefined> {
  return await auth.api.getSession({
    headers: await headers(),
  });
}
