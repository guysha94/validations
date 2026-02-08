import {ProtectedPage} from "~/components/auth";
import NewEventDialog from "~/components/NewEventDialog";
import EventTabs from "~/components/EventTabs";

type PageProps = {
    params: Promise<{ slug: string }>;
};

export default async function EventPage({params}: PageProps) {

    const {slug} = await params;

    return (
        <ProtectedPage>
            <div className="flex min-h-screen items-center justify-center bg-background py-12 px-4">
                <div className="w-full max-w-6xl">
                    <EventTabs slug={slug}/>
                </div>
            </div>
            <NewEventDialog/>
        </ProtectedPage>
    );
}
