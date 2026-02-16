import {ProtectedPage} from "~/components/auth";
import NewEventDialog from "~/components/NewEventDialog";
import EventTabs from "~/components/EventTabs";
import {fetchTeamsSlugs} from "~/lib/db/crud/teams";
import {fetchEventSlugsByTeamSlug, fetchEventWithRulesBySlug} from "~/lib/db/crud";
import {Suspense} from "react";
import Loader from "~/components/Loader";

type Params = {
    teamSlug: string,
    eventSlug: string
};

type PageProps = {
    params: Promise<Params>;
};

export async function generateStaticParams() {

    const [teamsSlugs, err] = await fetchTeamsSlugs();
    if (err) {
        console.error("Error fetching team slugs for static params:", err);
        return [];
    }
    const teamsSlugsEvents = {};
    for (const teamSlug of teamsSlugs) {
        const [eventSlugs, err] = await fetchEventSlugsByTeamSlug(teamSlug);
        if (err) {
            console.error(`Error fetching event slugs for team ${teamSlug}:`, err);
            continue;
        }
        teamsSlugsEvents[teamSlug] = eventSlugs
    }

    const params: Params[] = [];
    for (const teamSlug of teamsSlugs) {
        const eventSlugs = teamsSlugsEvents[teamSlug] || [];
        for (const eventSlug of eventSlugs) {
            params.push({teamSlug, eventSlug});
        }
    }
    return params;
}

export default async function EventPage({params}: PageProps) {

    const {eventSlug, teamSlug} = await params;

    const [eventWithRules, err] = await fetchEventWithRulesBySlug(teamSlug, eventSlug);
    if (err || !eventWithRules) {
        console.error(`Error fetching event with rules for team ${teamSlug} and event ${eventSlug}:`, err);
        return (
            <ProtectedPage>
                <div className="flex min-h-screen items-center justify-center bg-background py-12 px-4">
                    <div className="w-full max-w-6xl">
                        <h4 className="scroll-m-20 text-xl font-semibold tracking-tight text-red-500">
                            Failed to load event details
                        </h4>
                        <p className="leading-7 [&:not(:first-child)]:mt-6 text-red-500">
                            An error occurred while fetching the event details. Please try again later.
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
                    <Suspense fallback={<Loader fullscreen/>}>
                        <EventTabs slug={eventSlug} event={eventWithRules}/>
                    </Suspense>
                </div>
            </div>
            <NewEventDialog/>
        </ProtectedPage>
    );
}
