import "server-only";
import {and, eq, sql} from "drizzle-orm";
import {validationsDb} from "~/lib/db";
import {EventWithRules, SelectEvent, SelectRule} from "~/domain";
import {events, rules, teams} from "~/lib/db/schema";


export async function fetchAllEvents(): Promise<[SelectEvent[], Error | null | undefined]> {
    try {
        const results = await validationsDb.query.events.findMany();
        return [results, null];
    } catch (error) {
        console.error("Error fetching events:", error);
        return [[], error instanceof Error ? error : new Error("Failed to fetch events")];
    }
}

export async function fetchEventsByTeamId(
    teamId: string | null
): Promise<[SelectEvent[], Error | null | undefined]> {
    try {
        if (!teamId) return [[], null];
        const results = await validationsDb
            .select()
            .from(events)
            .where(eq(events.teamId, teamId));
        return [results, null];
    } catch (error) {
        console.error("Error fetching events by team:", error);
        return [[], error instanceof Error ? error : new Error("Failed to fetch events")];
    }
}

const fetchEventTypesByTeamSlugPrepare = validationsDb
    .select({type: events.type})
    .from(events)
    .leftJoin(teams, eq(events.teamId, teams.id))
    .where(eq(teams.slug, sql.placeholder("eventSlug")))
    .prepare();

export async function fetchEventSlugsByTeamSlug(
    teamSlug: string
): Promise<[string[], Error | null | undefined]> {
    "use cache";
    try {
        const results = await fetchEventTypesByTeamSlugPrepare.execute({eventSlug: teamSlug});
        const slugs = results.map(r => r.type);
        return [slugs, null];
    } catch (error) {
        console.error("Error fetching event slugs by team slug:", error);
        return [[], error instanceof Error ? error : new Error("Failed to fetch event slugs")];
    }
}


export async function fetchEventWithRulesBySlug(
    teamSlug: string,
    eventSlug: string
): Promise<[EventWithRules | null, Error | null | undefined]> {
    try {
        const results = await validationsDb
            .select()
            .from(events)
            .leftJoin(rules, eq(events.id, rules.eventId))
            .leftJoin(teams, eq(events.teamId, teams.id))
            .where(
                and(
                    eq(teams.slug, teamSlug),
                    eq(sql<string>`lower(
                    ${events.type}
                    )`, eventSlug.toLowerCase())
                )
            );

        if (results.length === 0) {
            return [null, null];
        }

        const eventWithRules = {
            ...results[0].events,
            rules: results
                .map((r) => r.rules)
                .filter((r): r is SelectRule => r !== null),
        };

        return [eventWithRules, null];
    } catch (error) {
        console.error("Error fetching event with rules:", error);
        return [null, error instanceof Error ? error : new Error("Failed to fetch event with rules")];
    }
}
