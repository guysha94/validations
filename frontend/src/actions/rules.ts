"use server";

import { eq } from "drizzle-orm";
import { uuidv7 } from "uuidv7";
import db from "~/db";
import { eventRules, rewardRules } from "~/db/schema";
import type { EventRule, RewardRule } from "~/domain";
import { cacheLife, cacheTag, revalidateTag } from "next/cache";

type AsyncResult<T> = Promise<{ data?: T; error?: Error }>;

async function resolveEventId(eventIdOrType: string): Promise<string | null> {
  const { resolveEventId: resolve } = await import("~/actions/events");
  return resolve(eventIdOrType);
}

export async function getEventRulesByEventId(
  eventIdOrType: string,
): AsyncResult<EventRule[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("events");
  try {
    const eventId = await resolveEventId(eventIdOrType);
    if (!eventId) return { error: new Error("Event not found") };
    const rows = await db
      .select()
      .from(eventRules)
      .where(eq(eventRules.eventId, eventId));
    return { data: rows as EventRule[] };
  } catch (err) {
    const error =
      err instanceof Error
        ? err
        : new Error("Failed to fetch event rules.");
    return { error };
  }
}

export async function getEventRuleById(
  eventIdOrType: string,
  ruleId: string,
): AsyncResult<EventRule> {
  "use cache";
  cacheLife("minutes");
  cacheTag("events");
  try {
    const eventId = await resolveEventId(eventIdOrType);
    if (!eventId) return { error: new Error("Event not found") };
    const [row] = await db
      .select()
      .from(eventRules)
      .where(eq(eventRules.id, ruleId));
    if (!row || row.eventId !== eventId) {
      return { error: new Error("Event rule not found") };
    }
    return { data: row as EventRule };
  } catch (err) {
    const error =
      err instanceof Error
        ? err
        : new Error("Failed to fetch event rule.");
    return { error };
  }
}

export async function getRewardRulesByEventId(
  eventIdOrType: string,
): AsyncResult<RewardRule[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("events");
  try {
    const eventId = await resolveEventId(eventIdOrType);
    if (!eventId) return { error: new Error("Event not found") };
    const rows = await db
      .select()
      .from(rewardRules)
      .where(eq(rewardRules.eventId, eventId));
    return { data: rows as RewardRule[] };
  } catch (err) {
    const error =
      err instanceof Error
        ? err
        : new Error("Failed to fetch reward rules.");
    return { error };
  }
}

export async function getRewardRuleById(
  eventIdOrType: string,
  ruleId: string,
): AsyncResult<RewardRule> {
  "use cache";
  cacheLife("minutes");
  cacheTag("events");
  try {
    const eventId = await resolveEventId(eventIdOrType);
    if (!eventId) return { error: new Error("Event not found") };
    const [row] = await db
      .select()
      .from(rewardRules)
      .where(eq(rewardRules.id, ruleId));
    if (!row || row.eventId !== eventId) {
      return { error: new Error("Reward rule not found") };
    }
    return { data: row as RewardRule };
  } catch (err) {
    const error =
      err instanceof Error
        ? err
        : new Error("Failed to fetch reward rule.");
    return { error };
  }
}

export async function createEventRule(
  input: Omit<EventRule, "id" | "createdAt" | "updatedAt">,
): AsyncResult<EventRule> {
  try {
    const id = uuidv7();
    await db.insert(eventRules).values({
      id,
      eventId: input.eventId,
      name: input.name,
      description: input.description ?? null,
      errorMessage: input.errorMessage,
      query: input.query ?? "",
      enabled: input.enabled ?? true,
      editAccess: input.editAccess ?? "restricted",
    });
    const [rule] = await db
      .select()
      .from(eventRules)
      .where(eq(eventRules.id, id));
    return { data: rule as EventRule };
  } catch (err) {
    const error =
      err instanceof Error ? err : new Error("Failed to create event rule.");
    return { error };
  } finally {
    revalidateTag("events", "minutes");
  }
}

export async function updateEventRule(
  id: string,
  input: Partial<Omit<EventRule, "id" | "eventId" | "createdAt">>,
): AsyncResult<EventRule> {
  try {
    const set = Object.fromEntries(
      Object.entries(input).filter(([, v]) => v !== undefined),
    ) as Partial<EventRule>;
    await db
      .update(eventRules)
      .set(set as any)
      .where(eq(eventRules.id, id));
    const [rule] = await db
      .select()
      .from(eventRules)
      .where(eq(eventRules.id, id));
    return { data: rule as EventRule };
  } catch (err) {
    const error =
      err instanceof Error ? err : new Error("Failed to update event rule.");
    return { error };
  } finally {
    revalidateTag("events", "minutes");
  }
}

export async function deleteEventRule(id: string): AsyncResult<void> {
  try {
    await db.delete(eventRules).where(eq(eventRules.id, id));
    return { data: undefined };
  } catch (err) {
    const error =
      err instanceof Error ? err : new Error("Failed to delete event rule.");
    return { error };
  } finally {
    revalidateTag("events", "minutes");
  }
}

export async function createRewardRule(
  input: Omit<RewardRule, "id" | "createdAt" | "updatedAt">,
): AsyncResult<RewardRule> {
  try {
    const id = uuidv7();
    await db.insert(rewardRules).values({
      id,
      eventId: input.eventId,
      name: input.name,
      enabled: input.enabled ?? true,
      editAccess: input.editAccess ?? "restricted",
      queries: (input.queries ?? []) as any,
      tab: input.tab ?? "",
      column: input.column ?? "",
    });
    const [rule] = await db
      .select()
      .from(rewardRules)
      .where(eq(rewardRules.id, id));
    return { data: rule as RewardRule };
  } catch (err) {
    const error =
      err instanceof Error ? err : new Error("Failed to create reward rule.");
    return { error };
  } finally {
    revalidateTag("events", "minutes");
  }
}

export async function updateRewardRule(
  id: string,
  input: Partial<Omit<RewardRule, "id" | "eventId" | "createdAt">>,
): AsyncResult<RewardRule> {
  try {
    const set = Object.fromEntries(
      Object.entries(input).filter(([, v]) => v !== undefined),
    ) as Partial<RewardRule>;
    await db
      .update(rewardRules)
      .set(set as any)
      .where(eq(rewardRules.id, id));
    const [rule] = await db
      .select()
      .from(rewardRules)
      .where(eq(rewardRules.id, id));
    return { data: rule as RewardRule };
  } catch (err) {
    const error =
      err instanceof Error ? err : new Error("Failed to update reward rule.");
    return { error };
  } finally {
    revalidateTag("events", "minutes");
  }
}

export async function deleteRewardRule(id: string): AsyncResult<void> {
  try {
    await db.delete(rewardRules).where(eq(rewardRules.id, id));
    return { data: undefined };
  } catch (err) {
    const error =
      err instanceof Error ? err : new Error("Failed to delete reward rule.");
    return { error };
  } finally {
    revalidateTag("events", "minutes");
  }
}

type EventRuleInput = EventRule & { eventId: string; updatedAt?: Date };
type RewardRuleInput = RewardRule & { eventId: string; updatedAt?: Date };

export async function upsertEventRules(
  rules: EventRuleInput[],
): AsyncResult<EventRule[]> {
  try {
    const results: EventRule[] = [];
    for (const r of rules) {
      const payload = {
        eventId: r.eventId,
        name: r.name,
        description: r.description ?? null,
        errorMessage: r.errorMessage,
        query: r.query ?? "",
        enabled: r.enabled ?? true,
        editAccess: r.editAccess ?? "restricted",
      };
      if (r.id && !r.id.startsWith("new-")) {
        const { data } = await updateEventRule(r.id, payload);
        if (data) results.push(data);
      } else {
        const { data } = await createEventRule(payload);
        if (data) results.push(data);
      }
    }
    return { data: results };
  } catch (err) {
    const error =
      err instanceof Error ? err : new Error("Failed to upsert event rules.");
    return { error };
  } finally {
    revalidateTag("events", "minutes");
  }
}

export async function deleteManyEventRules(ids: string[]): AsyncResult<void> {
  try {
    for (const id of ids) {
      await deleteEventRule(id);
    }
    return { data: undefined };
  } catch (err) {
    const error =
      err instanceof Error ? err : new Error("Failed to delete event rules.");
    return { error };
  } finally {
    revalidateTag("events", "minutes");
  }
}

export async function upsertRewardRules(
  rules: RewardRuleInput[],
): AsyncResult<RewardRule[]> {
  try {
    const results: RewardRule[] = [];
    for (const r of rules) {
      const payload = {
        eventId: r.eventId,
        name: r.name,
        enabled: r.enabled ?? true,
        editAccess: r.editAccess ?? "restricted",
        queries: (r.queries ?? []) as any,
        tab: r.tab ?? "",
        column: r.column ?? "",
      };
      if (r.id && !r.id.startsWith("new-")) {
        const { data } = await updateRewardRule(r.id, payload);
        if (data) results.push(data);
      } else {
        const { data } = await createRewardRule(payload);
        if (data) results.push(data);
      }
    }
    return { data: results };
  } catch (err) {
    const error =
      err instanceof Error ? err : new Error("Failed to upsert reward rules.");
    return { error };
  } finally {
    revalidateTag("events", "minutes");
  }
}

export async function deleteManyRewardRules(ids: string[]): AsyncResult<void> {
  try {
    for (const id of ids) {
      await deleteRewardRule(id);
    }
    return { data: undefined };
  } catch (err) {
    const error =
      err instanceof Error ? err : new Error("Failed to delete reward rules.");
    return { error };
  } finally {
    revalidateTag("events", "minutes");
  }
}
