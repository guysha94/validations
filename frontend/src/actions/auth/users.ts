"use server";

import { count, eq, inArray, not } from "drizzle-orm";
import { cacheTag } from "next/cache";
import { db } from "~/db";
import { members, users } from "~/db/schema";
import type { AsyncResult, User } from "~/domain";

export async function getUsers(organizationId: string): AsyncResult<User[]> {
  try {
    const orgMembers = await db.query.members.findMany({
      where: eq(members.organizationId, organizationId),
    });

    const orgUsers = await db.query.users.findMany({
      where: not(
        inArray(
          users.id,
          orgMembers.map((m) => m.userId),
        ),
      ),
    });

    return { data: orgUsers };
  } catch (err) {
    console.error(err);
    const error =
      err instanceof Error ? err : new Error("Failed to fetch users.");
    return { error };
  }
}

export async function countUsers(): AsyncResult<number> {
  "use cache";
  cacheTag("users", "count-users");
  try {
    const totalUsers = await db.select({ totalCount: count() }).from(users);

    return { data: totalUsers?.[0]?.totalCount };
  } catch (err) {
    console.error(err);
    const error =
      err instanceof Error ? err : new Error("Failed to count users.");
    return { error };
  }
}
