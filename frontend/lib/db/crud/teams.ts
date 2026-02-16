import "server-only";
import {validationsDb} from "~/lib/db";
import {InsertTeamMember, SelectTeam} from "~/domain";
import {eq, sql} from "drizzle-orm";
import {teamMembers, teams} from "~/lib/db/schema";

export async function fetchUserTeams(userId: string): Promise<[SelectTeam[], Error | null | undefined]> {
    try {

        const results = await validationsDb
            .select()
            .from(teams)
            .innerJoin(teamMembers, eq(teams.id, teamMembers.teamId))
            .where(eq(teamMembers.userId, userId))
            .orderBy(teams.name);

        const teamsOnly = results.flatMap(r => r.teams);

        return [teamsOnly, null];


    } catch (error) {
        console.error("Error fetching events:", error);
        return [[], error instanceof Error ? error : new Error("Failed to fetch events")];
    }
}

export async function setTeamMember(values: InsertTeamMember): Promise<[boolean, Error | null]> {
    try {
        await validationsDb
            .insert(teamMembers)
            .values(values)
            .onDuplicateKeyUpdate({
                set: {
                    id: sql.raw('id')
                }
            });
        return [true, null];
    } catch (error) {
        console.error("Error setting team member:", error);
        return [false, error instanceof Error ? error : new Error("Failed to set team member")];
    }
}

const fetchTeamsSlugsPrepare = validationsDb
    .select({slug: teams.slug})
    .from(teams)
    .prepare();

export async function fetchTeamsSlugs(): Promise<[string[], Error | null]> {


    try {
        const results = await fetchTeamsSlugsPrepare.execute();
        const slugs = results.map(r => r.slug);
        return [slugs, null];
    } catch (error) {
        console.error("Error fetching team slugs:", error);
        return [[], error instanceof Error ? error : new Error("Failed to fetch team slugs")];
    }


}