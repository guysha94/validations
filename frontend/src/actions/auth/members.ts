"use server";

import { eq } from "drizzle-orm";
import db from "~/db";
import { members } from "~/db/schema";
import type { Role } from "~/domain";
import { auth } from "~/lib/auth/server";
import { isAdmin } from "./permissions";

export const addMember = async (
  organizationId: string,
  userId: string,
  role: Role,
) => {
  try {
    await auth.api.addMember({
      body: {
        userId,
        organizationId,
        role,
      },
    });
  } catch (error) {
    console.error(error);
    throw new Error("Failed to add member.");
  }
};

export const removeMember = async (memberId: string) => {
  const admin = await isAdmin();

  if (!admin) {
    return {
      success: false,
      error: "You are not authorized to remove members.",
    };
  }

  try {
    await db.delete(members).where(eq(members.id, memberId));

    return {
      success: true,
      error: null,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: "Failed to remove member.",
    };
  }
};
