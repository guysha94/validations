"use server";
import {eq, or} from "drizzle-orm";
import db from "~/db";
import {eventRules, events, rewardRules, teams} from "~/db/schema";
import type {AsyncResult, Event, EventRule, EventWithRules, RewardRule, Team} from "~/domain";
import {cacheLife, cacheTag, revalidateTag} from "next/cache";
import {CreateEventDto} from "~/lib/validations";
import {MySqlSelect} from "drizzle-orm/mysql-core";
import {UpdateEventDto} from "~/lib/validations";

export async function getEventTypesWithTeamSlugs(): AsyncResult<
    Array<{ eventType: string; teamSlug: string }>
> {
    "use cache";
    cacheLife("minutes");
    cacheTag("events");
    try {
        const result = await db
            .select({eventType: events.type, teamSlug: teams.slug})
            .from(events)
            .innerJoin(teams, eq(teams.id, events.teamId));

        return {data: result};
    } catch (err) {
        console.error(err);
        const error =
            err instanceof Error
                ? err
                : new Error("Failed to fetch event types with team slugs.");
        return {error};
    }
}

function withRules<T extends MySqlSelect>(qb: T) {
    return qb
        .leftJoin(eventRules, eq(eventRules.eventId, events.id))
        .leftJoin(rewardRules, eq(rewardRules.eventId, events.id));
}

function withTeam<T extends MySqlSelect>(qb: T) {
    return qb
        .innerJoin(teams, eq(teams.id, events.teamId));
}

export async function getEventsWithRulesByTeamSlug(
    teamSlug: string,
): AsyncResult<Array<EventWithRules>> {
    "use cache";
    cacheLife("minutes");
    cacheTag("events");
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
                eventsMap[eventId] = {eventRules: [], rewardRules: []};
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

        return {data: eventsWithRules};
    } catch (err) {
        console.error(err);
        const error =
            err instanceof Error
                ? err
                : new Error("Failed to fetch events with rules by team slug.");
        return {error};
    }
}

export async function updateEvent(
    eventId: string,
    payload: UpdateEventDto,
): AsyncResult<void> {
    try {
        const set: Record<string, unknown> = {updatedAt: new Date()};
        for(const key in payload) {
            if (payload[key as keyof UpdateEventDto] != null) {
                set[key] = payload[key as keyof UpdateEventDto] as unknown;
            }
        }
        if (Object.keys(set).length <= 1) return {data: undefined};
        await db
            .update(events)
            .set(set as Record<string, unknown>)
            .where(eq(events.id, eventId));
        return {data: undefined};
    } catch (err) {
        const error =
            err instanceof Error ? err : new Error("Failed to update event.");
        return {error};
    } finally {
        revalidateTag("events", "minutes");
    }
}

export async function updateEventSchema(
    eventId: string,
    eventSchema: Record<string, unknown>,
): AsyncResult<void> {
    try {
        await db
            .update(events)
            .set({eventSchema: eventSchema as any})
            .where(eq(events.id, eventId));
        return {data: undefined};
    } catch (err) {
        const error =
            err instanceof Error ? err : new Error("Failed to update event schema.");
        return {error};
    } finally {
        revalidateTag("events", "minutes");
    }
}

export async function createEvent(event: CreateEventDto): AsyncResult<string> {
    try {
        const result = await db.insert(events).values(event as any).$returningId();
        const insertedId = result?.[0]?.id || null;
        if (!insertedId) {
            return {error: new Error("Failed to retrieve inserted event ID.")};
        }
        return {data: insertedId}
    } catch (err) {
        const error =
            err instanceof Error ? err : new Error("Failed to create event.");
        return {error};
    } finally {
        revalidateTag("events", "minutes");
    }
}

type EventWithTeamAndRules = {
    events: Event,
    teams: Team,
    event_rules: EventRule,
    reward_rules: RewardRule
};

export async function getEventById(eventId: string, options: {
    withRules?: boolean;
    withTeam?: boolean;
} = {withRules: false, withTeam: false}): AsyncResult<Event | EventWithRules> {
    "use cache";
    cacheLife("minutes");
    cacheTag("events");
    try {
        const {withRules: isWithRules = false, withTeam: isWithTeam = false} = options;

        let query = db
            .select()
            .from(events)
            .$dynamic();

        if (isWithTeam) {
            // @ts-ignore
            query = withTeam(query);
        }
        if (isWithRules) {
            // @ts-ignore
            query = withRules(query);
        }

        const result: (Event | EventWithTeamAndRules)[] = await query.where(
            or(eq(events.id, eventId), eq(events.type, eventId))) as any;

        if (result.length === 0) {
            return {error: new Error("Event not found")};
        }


        if (!isWithTeam && !isWithRules) return {data: result[0] as Event};
        const firstRow = result[0] as EventWithTeamAndRules;
        const eventData = {
            ...firstRow.events,
            team: firstRow.teams,
        };
        const eventRulesData = result
            .filter((row) => (row as EventWithTeamAndRules).event_rules?.id)
            .map((row) => (row as EventWithTeamAndRules).event_rules) as EventRule[];
        const rewardRulesData = result
            .filter((row) => (row as EventWithTeamAndRules).reward_rules?.id)
            .map((row) => (row as EventWithTeamAndRules).reward_rules) as RewardRule[];

        return {
            data: {
                ...eventData,
                eventRules: eventRulesData,
                rewardRules: rewardRulesData,
            },
        };
    } catch (err) {
        console.error(err);
        const error =
            err instanceof Error
                ? err
                : new Error("Failed to fetch event by ID.");
        return {error};
    }
}

export async function resolveEventId(
    eventIdOrType: string,
): Promise<string | null> {
    const { data } = await getEventById(eventIdOrType);
    return (data as { id?: string })?.id ?? null;
}

export async function deleteEvent(eventId: string): AsyncResult<void> {
    try {
        await db.delete(events).where(eq(events.id, eventId));
        return {data: undefined};
    } catch (err) {
        const error =
            err instanceof Error ? err : new Error("Failed to delete event.");
        return {error};
    } finally {
        revalidateTag("events", "minutes");
    }
}
