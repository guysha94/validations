"use server";

import { and, count, eq, inArray } from "drizzle-orm";
import { cacheTag } from "next/cache";
import { uuidv7 } from "uuidv7";
import db from "~/db";
import { members, organizations } from "~/db/schema";
import type { AsyncResult, Organization } from "~/domain";
import { ORGANIZATION_SLUG } from "~/lib/constants";
import { getSession } from "./session";

export async function getOrganizations() {
  try {
    const session = await getSession();

    if(!session) {
      return [null, new Error("User not found.")];
    }

    const userMembers = await db.query.members.findMany({
      where: eq(members.userId, session.user.id),
    });

    const userOrganizations = await db.query.organizations.findMany({
      where: inArray(
        organizations.id,
        userMembers.map((m) => m.organizationId),
      ),
    });

    return [userOrganizations, null];
  } catch (error) {
    console.error(error);
    const err =
      error instanceof Error
        ? error
        : new Error("Failed to fetch organizations.");
    return [null, err];
  }
}

export async function getActiveOrganization(
  userId: string,
): Promise<[Organization | null | undefined, Error | null | undefined]> {
  try {
    const memberUser = await db.query.members.findFirst({
      where: eq(members.userId, userId),
    });

    if (!memberUser) {
      return [null, new Error("User is not a member of any organization.")];
    }

    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, memberUser.organizationId),
    });
    return [org as Organization, null];
  } catch (error) {
    console.error(error);
    const err =
      error instanceof Error
        ? error
        : new Error("Failed to fetch active organization.");
    return [null, err];
  }
}

export async function getOrganizationBySlug(slug: string) {
  try {
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.slug, slug),
      with: {
        members: {
          with: {
            user: true,
          },
        },
      },
    });

    return [org, null];
  } catch (error) {
    console.error(error);
    const err =
      error instanceof Error
        ? error
        : new Error("Failed to fetch organization.");
    return [null, err];
  }
}

export async function getOrganizationId() {
  try {
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.slug, ORGANIZATION_SLUG),
      columns: { id: true },
    });

    return org?.id;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function addMemberToOrganization(
  userId: string,
  role: string = "member",
) {
  const organizationId = await getOrganizationId();

  if (!organizationId) {
    console.error("Organization not found.");
    return;
  }

  try {
    const isUserAlreadyMember = await db.query.members.findFirst({
      where: and(
        eq(members.userId, userId),
        eq(members.organizationId, organizationId),
      ),
      columns: { id: true },
    });
    if (isUserAlreadyMember?.id) return true;
    await db.insert(members).values({
      id: uuidv7(),
      userId,
      organizationId,
      role,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error("Error adding member to organization:", error);
  }
}

export async function countOrganizationMembers() {
  try {
    const organizationId = await getOrganizationId();

    if (!organizationId) {
      console.error("Organization not found.");
      return;
    }
    const countResult = await db
      .select({
        c: count(),
      })
      .from(members)
      .where(eq(members.organizationId, organizationId));
    return countResult?.[0]?.c || 0;
  } catch (error) {
    console.error("Error counting organization members:", error);
    return 0;
  }
}

export async function countOrganization(): AsyncResult<number> {
  "use cache";
  cacheTag("organizations");
  try {
    const totalResult = await db.select({ total: count() }).from(organizations);

    return { data: totalResult?.[0]?.total };
  } catch (err) {
    console.error(err);
    const error =
      err instanceof Error ? err : new Error("Failed to count users.");
    return { error };
  }
}
