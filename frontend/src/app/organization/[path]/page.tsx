import {OrganizationView} from "@daveyplate/better-auth-ui";


type Props = {
    params: Promise<{ path: string }>;
};
export default async function OrganizationPage({params}: Props) {
    const {path} = await params;

    return (
        <div className="container p-4 md:p-6">
            <OrganizationView path={path}/>
        </div>
    );
}
