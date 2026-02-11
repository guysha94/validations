import {getActiveTeam, getSession} from "~/lib/actions";
import {redirect} from "next/navigation";
import {ROOT_ROUTE, SIGN_IN_ROUTE} from "~/lib/constants";



export default async function RootPage() {

    const session = await getSession();
    if (!session ) return redirect(SIGN_IN_ROUTE);

    const team = await getActiveTeam();
    if (!!team) return redirect(`${ROOT_ROUTE}${team.slug}`);


    if (!!session) return redirect('/select-team');
    return redirect(SIGN_IN_ROUTE);

}
