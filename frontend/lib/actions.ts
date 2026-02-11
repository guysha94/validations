"use server";
import {auth} from "~/lib/auth/server";
import {headers, headers as getHeaders} from "next/headers";
import {ORG_SLUG} from "~/lib/constants";
import {SelectTeam} from "~/domain";

export async function setActiveOrganization() {

    const headers = await getHeaders();
    try {
        await auth.api.setActiveOrganization({
            headers,
            body: {
                organizationSlug: ORG_SLUG,
            },
        });
        return await auth.api.getFullOrganization({
            headers,
        });
    } catch (error) {
        console.error("Failed to set active organization:", error);
        return null;
    }
}

export async function getActiveTeam(): Promise<SelectTeam> {
    const headers = await getHeaders();
    const session = await auth.api.getSession({
        headers,
    });
    let teams: SelectTeam[] = [];
    let activeTeamId = session?.session.activeTeamId;
    if (!!session?.session) {
        teams = await auth.api.listUserTeams({
            headers,
        }) as SelectTeam[];
        if (!activeTeamId?.length) {
            if (!!teams.length) {
                activeTeamId = teams[0].id;
                await auth.api.setActiveTeam({
                    headers,
                    body: {
                        teamId: activeTeamId,
                    }
                })
            }

        }
    }
    return teams.find((t) => t.id === activeTeamId)! as SelectTeam;
}

export async function getSession() {
    return await auth.api.getSession({headers: await headers()});
}

