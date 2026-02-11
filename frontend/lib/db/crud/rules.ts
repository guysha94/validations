import "server-only";
import {SelectRule} from "~/domain";
import {events, rules} from "~/lib/db/schema";
import {eq, or, sql} from "drizzle-orm";
import {validationsDb} from "~/lib/db";


export async function fetchEventRules(slug: string): Promise<[SelectRule[], Error | null | undefined]> {

    try {
        const eventRules = await validationsDb
            .select()
            .from(rules)
            .innerJoin(events, eq(rules.eventId, events.id))
            .where(or(
                eq(events.id, slug),
                eq(sql<string>`LOWER(
                ${events.type}
                )`, slug.toLowerCase())
            ));
        const results = eventRules?.flatMap(r => r.rules) || [];
        return [results, null];
    } catch (error) {
        console.error("Error fetching rules:", error);
        return [[], error instanceof Error ? error : new Error("Failed to fetch rules")];
    }
}