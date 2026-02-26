import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex } from "@noble/hashes/utils.js";
import { type ClassValue, clsx } from "clsx";
import { jwtVerify } from "jose";
import generateSlug from "slugify";
import compile from "string-template/compile";
import { twMerge } from "tailwind-merge";
import type { Session } from "~/domain";
import { Routes } from "~/lib/constants";
import env from "~/lib/env";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const slugify = (text: string) =>
  generateSlug(text, {
    lower: true,
    strict: true,
  });

export function getGravatarUrl(email?: string | null): string | null {
  if (!email) return null;

  try {
    const normalizedEmail = email.trim().toLowerCase();
    const encoder = new TextEncoder();
    const emailBytes = encoder.encode(normalizedEmail);
    const hash = bytesToHex(sha256(emailBytes));

    let url = `https://gravatar.com/avatar/${hash}`;

    const params = new URLSearchParams();

    params.append("f", "y");
    const queryString = params.toString();
    if (queryString) {
      url += `?${queryString}`;
    }

    return url;
  } catch (error) {
    console.error("Error generating Gravatar URL:", error);
    return null;
  }
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = slugify(filename);
  a.click();
  URL.revokeObjectURL(url);
}

export async function decodeSessionCookie(
  raw: string,
): Promise<Session | undefined> {
  const secret = env.BETTER_AUTH_SECRET!;
  const v = decodeURIComponent(raw);
  const parts = v.split(".");

  if (parts.length === 3) {
    const { payload } = await jwtVerify<Session>(
      v,
      new TextEncoder().encode(secret),
      { algorithms: ["HS256"] },
    );
    return payload;
  }
}

export const getEventRoute = compile(Routes.EVENT);
