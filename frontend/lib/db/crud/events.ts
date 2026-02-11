import "server-only";
import { eq } from "drizzle-orm";
import { validationsDb } from "~/lib/db";
import { SelectEvent } from "~/domain";
import { events } from "~/lib/db/schema";

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

