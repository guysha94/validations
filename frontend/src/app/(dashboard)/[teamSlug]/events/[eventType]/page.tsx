import {getTeamBySlug} from "~/actions";
import {ProtectedPage} from "~/components/auth";
import EventTabs from "~/components/event-tabs";
import NewEventDialog from "~/components/NewEventDialog";

type Params = {
    teamSlug: string;
    eventType: string;
};

type PageProps = {
    params: Promise<Params>;
};


export default async function EventPage({params}: PageProps) {
    const {teamSlug} = await params;

    const {data: team, error} = await getTeamBySlug(teamSlug);

    if (error || !team) {
        console.error(`Error fetching team details for team ${teamSlug}:`, error);
        return (
            <ProtectedPage>
                <div className="flex min-h-screen items-center justify-center bg-background py-12 px-4">
                    <div className="w-full max-w-6xl">
                        <h4 className="scroll-m-20 text-xl font-semibold tracking-tight text-red-500">
                            Failed to load team details
                        </h4>
                        <p className="leading-7 [&:not(:first-child)]:mt-6 text-red-500">
                            An error occurred while fetching the team details. Please try
                            again later.
                        </p>
                    </div>
                </div>
            </ProtectedPage>
        );
    }

    return (
        <ProtectedPage>
            <div className="flex min-h-screen items-center justify-center bg-background py-12 px-4">
                <div className="w-full max-w-6xl">
                    <EventTabs/>
                </div>
            </div>
        </ProtectedPage>
    );
}
