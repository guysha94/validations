import "server-only";
import {SelectInvitation} from "~/domain";
import {validationsDb} from "~/lib/db";
import {eq} from "drizzle-orm";
import {invitations} from "~/lib/db/schema";

export async function fetchInvitation(invitationId: string): Promise<[SelectInvitation, Error | null]> {

    try {

        const invitation = await validationsDb.query.invitations.findFirst({
            where: eq(invitations.id, invitationId)
        });
        return !!invitation ? [invitation, null] : [null as any, new Error("Invitation not found")];
    } catch (error) {
        console.error("Error fetching invitation:", error);
        return [null as any, error instanceof Error ? error : new Error("Failed to fetch invitation")];
    }
}

export async function setInvitationStatus(invitationId: string, status: "accepted" | "rejected"): Promise<[boolean, Error | null]> {
    try {
        await validationsDb.update(invitations)
            .set({status})
            .where(eq(invitations.id, invitationId));
        return [true, null];
    } catch (error) {
        console.error(`Error updating invitation status to ${status}:`, error);
        return [false, error instanceof Error ? error : new Error(`Failed to update invitation status to ${status}`)];
    }
}