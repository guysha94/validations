"use server";
import { eq, or } from "drizzle-orm";
import db from "~/db";
import { eventRules, events, rewardRules, teams } from "~/db/schema";
import type {
  AsyncResult,
  EventRule,
  EventWithRules,
  RewardRule,
} from "~/domain";

export async function getEventTypesWithTeamSlugs(): AsyncResult<
  Array<{ eventType: string; teamSlug: string }>
> {
  try {
    const result = await db
      .select({ eventType: events.type, teamSlug: teams.slug })
      .from(events)
      .innerJoin(teams, eq(teams.id, events.teamId));

    return { data: result };
  } catch (err) {
    console.error(err);
    const error =
      err instanceof Error
        ? err
        : new Error("Failed to fetch event types with team slugs.");
    return { error };
  }
}

export async function getEventsWithRulesByTeamSlug(
  teamSlug: string,
): AsyncResult<Array<EventWithRules>> {
  try {
    const result = await db
      .select()
      .from(events)
      .innerJoin(teams, eq(teams.id, events.teamId))
      .leftJoin(eventRules, eq(eventRules.eventId, events.id))
      .leftJoin(rewardRules, eq(rewardRules.eventId, events.id))
      .where(or(eq(teams.id, teamSlug), eq(teams.slug, teamSlug)));

    const eventsMap: Record<
      string,
      { eventRules: EventRule[]; rewardRules: RewardRule[] }
    > = {};

    for (const row of result) {
      const eventId = row.events.id;
      if (!eventsMap[eventId]) {
        eventsMap[eventId] = { eventRules: [], rewardRules: [] };
      }
      if (row.event_rules?.id) {
        eventsMap[eventId].eventRules.push(row.event_rules);
      }
      if (row.reward_rules?.id) {
        eventsMap[eventId].rewardRules.push(row.reward_rules);
      }
    }

    const eventsWithRules: EventWithRules[] = Object.entries(eventsMap).map(
      ([eventId, rules]) => {
        const row = result.find((r) => r.events.id === eventId);
        if (!row) throw new Error(`Event ${eventId} not found in result`);
        return {
          ...row.events,
          eventRules: rules.eventRules,
          rewardRules: rules.rewardRules,
        };
      },
    );

    return { data: eventsWithRules };
  } catch (err) {
    console.error(err);
    const error =
      err instanceof Error
        ? err
        : new Error("Failed to fetch events with rules by team slug.");
    return { error };
  }
}

export async function updateEvent(
  eventId: string,
  payload: {
    type?: string;
    label?: string;
    icon?: string;
    eventSchema?: Record<string, unknown>;
    editAccess?: string;
  },
): AsyncResult<void> {
  try {
    const set: Record<string, unknown> = { updatedAt: new Date() };
    if (payload.type != null) set.type = payload.type;
    if (payload.label != null) set.label = payload.label;
    if (payload.icon != null) set.icon = payload.icon;
    if (payload.eventSchema != null) set.eventSchema = payload.eventSchema;
    if (payload.editAccess != null) set.editAccess = payload.editAccess;
    if (Object.keys(set).length <= 1) return { data: undefined };
    await db
      .update(events)
      .set(set as Record<string, unknown>)
      .where(eq(events.id, eventId));
    return { data: undefined };
  } catch (err) {
    const error =
      err instanceof Error ? err : new Error("Failed to update event.");
    return { error };
  }
}

export async function updateEventSchema(
  eventId: string,
  eventSchema: Record<string, unknown>,
): AsyncResult<void> {
  try {
    await db
      .update(events)
      .set({ eventSchema: eventSchema as any })
      .where(eq(events.id, eventId));
    return { data: undefined };
  } catch (err) {
    const error =
      err instanceof Error ? err : new Error("Failed to update event schema.");
    return { error };
  }
}
