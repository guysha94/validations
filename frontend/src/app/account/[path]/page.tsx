import {AccountView} from "@daveyplate/better-auth-ui";


type Props = {
    params: Promise<{ path: string }>;
};

export default async function AccountPage({params}: Props) {
    const {path} = await params;
    return (
        <div className="container p-4 md:p-6">
            <AccountView path={path} showTeams/>
        </div>
    );
}
