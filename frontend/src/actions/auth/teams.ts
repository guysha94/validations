"use server";

import {eq, or} from "drizzle-orm";
import {uuidv7} from "uuidv7";
import db from "~/db";
import {teamMembers, teams} from "~/db/schema";
import type {AsyncResult, Optional, Role, Team} from "~/domain";
import {getSession} from "./session";

export async function getTeams() {
    try {
        const allTeams = await db.query.teams.findMany();
        return [allTeams, null];
    } catch (error) {
        console.error(error);
        const err =
            error instanceof Error ? error : new Error("Failed to fetch teams.");
        return [null, err];
    }
}

export async function getTeamMembers(
    userId: string,
): Promise<[Team[] | null, Error | null]> {
    try {
        const teamMemberships = await db
            .select()
            .from(teams)
            .innerJoin(teamMembers, eq(teams.id, teamMembers.teamId))
            .where(eq(teamMembers.userId, userId));

        const teamsData = teamMemberships.map((tm) => tm.teams);

        return [teamsData, null];
    } catch (error) {
        console.error(error);
        const err =
            error instanceof Error
                ? error
                : new Error("Failed to fetch team members.");
        return [null, err];
    }
}

export async function getTeamSlugs(): AsyncResult<string[]> {
    "use cache";
    try {
        const teamMemberships = await db.query.teams.findMany({
            columns: {slug: true},
        });

        const teamSlugs = teamMemberships.map((tm) => tm.slug);

        return {data: teamSlugs};
    } catch (err) {
        console.error(err);
        const error =
            err instanceof Error ? err : new Error("Failed to fetch team slugs.");
        return {error};
    }
}

export async function getTeamBySlug(slug: string): AsyncResult<Team> {
    "use cache";

    try {
        const team = await db.query.teams.findFirst({
            where: or(eq(teams.slug, slug), eq(teams.id, slug)),
        });

        if (!team) {
            return {error: new Error(`Team with slug ${slug} not found.`)};
        }

        return {data: team};
    } catch (err) {
        console.error(err);
        const error =
            err instanceof Error ? err : new Error("Failed to fetch team by slug.");
        return {error};
    }
}

export async function addMemberToTeam(
    userId: string,
    role: Role,
    teamId: Optional<string> = null,
) {
    try {
        const id = uuidv7();
        if (teamId?.length) {
            await db.insert(teamMembers).values({
                id,
                userId,
                teamId,
                role,
            });
        } else {
            const teamsIds = await db.query.teams.findMany({
                columns: {id: true},
            });
            const values = teamsIds.map((t) => ({
                id: uuidv7(),
                userId,
                teamId: t.id,
                role,
            }));

            await db.insert(teamMembers).values(values);

            return true;
        }
    } catch (err) {
        console.error(err);
        return false;
    }
}

export async function getTeamSlugById(teamId: string): AsyncResult<string> {
    "use cache";

    try {
        const team = await db.query.teams.findFirst({
            where: eq(teams.id, teamId),
            columns: {slug: true},
        });

        if (!team) {
            return {error: new Error(`Team with id ${teamId} not found.`)};
        }

        return {data: team.slug};
    } catch (err) {
        console.error(err);
        const error =
            err instanceof Error
                ? err
                : new Error("Failed to fetch team slug by id.");
        return {error};
    }
}

export async function getActiveTeam(): AsyncResult<Team> {
    try {
        const session = await getSession()
        if (!session) {
            return {data: null};
        }
        const teamId = session.session.activeTeamId;
        if (!teamId)
            return {error: new Error("No active team ID found in session.")};
        return await getTeamBySlug(teamId);
    } catch (err) {
        console.error(err);
        const error =
            err instanceof Error ? err : new Error("Failed to fetch active team.");
        return {error};
    }
}
