import {NextRequest} from "next/server";
import {redirect} from "next/navigation";
import {auth} from "~/lib/auth/server";
import {headers as getHeaders} from "next/headers";
import slugify from "slugify";


export async function GET(req: NextRequest) {

    const invitationId = req.nextUrl.searchParams.get('invitationId');
    if (!invitationId?.trim()) {
        return redirect(`/auth/sign-in?error=invitation_not_found`);
    }
    const headers = await getHeaders();
    const invitation = await auth.api.acceptInvitation({
        headers,
        body: {
            invitationId,
        }
    });
    if (!invitation?.invitation || !invitation?.member) {
        return redirect(`/auth/sign-in?error=invitation_not_found`);
    }

    const team = await auth.api.setActiveTeam({
        headers,
        body: {
            teamId: invitation.invitation.teamId,
        }
    });
    if (!team) {
        return redirect(`/auth/sign-in?error=failed_to_accept_invitation`);
    }
    return redirect(`/${slugify(team.name)}`);


    // const [invitation, err] = await fetchInvitation(invitationId?.trim() as string);
    // if (err || !invitation) {
    //     return redirect(`/auth/sign-in?error=invitation_not_found`);
    // }
    //
    // const [success, updateErr] = await setInvitationStatus(invitationId, "accepted");
    // if (!success || updateErr) {
    //     return redirect(`/auth/sign-in?error=failed_to_accept_invitation`);
    // }
    // const [user, userErr] = await fetchUserByEmail(invitation.email);
    // if (!user || userErr) {
    //     return redirect(`/auth/sign-in?error=failed_to_accept_invitation`);
    // }
    //
    // const [tmSuccess, teamMemberErr] = await setTeamMember({
    //     id: uuidv7(),
    //     teamId: invitation.teamId as string,
    //     userId: user.id,
    //     role: invitation.role as string | undefined,
    // });
    // if (!teamMemberErr) {
    //     return redirect(`/auth/sign-in?success=invitation_accepted`);
    // }
    //     return redirect(`/auth/sign-in?error=failed_to_accept_invitation`);
}