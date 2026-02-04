"use client";
import {Card, CardContent, CardDescription, CardHeader, CardTitle,} from "~/components/ui/card";
import RulesForm from "~/components/forms/RulesForm";
import {ilike, useLiveQuery} from "@tanstack/react-db";
import {eventsCollection} from "~/db/collections";
import SkeletonCard from "~/components/CardSkeleton";
import {useEffect, useMemo} from "react";
import dynamic from "next/dynamic";
import Loader from "~/components/Loader";
import {useValidationsStore} from "~/store";
import {useShallow} from "zustand/react/shallow";



export function RulesCardComponent() {

    const {setIsFetchingRules, currentEvent} = useValidationsStore(useShallow((state) => state));

    const {data: events = [], isLoading} = useLiveQuery(
        (q) => q.from({event: eventsCollection})
            .where(({event}) => ilike(event.type, currentEvent?.type || ''))
            .select(({event}) => ({
                label: event.label,
                event_type: event.type,
                id: event.id,
            }))
            .orderBy(({event}) => event.id, 'asc')
            .limit(1)
    );

    const event = useMemo(() => events?.[0] || {
        label: `Event Of Type "${currentEvent?.label} Not Found"`,
        event_type: currentEvent?.type || 'unknown',
        id: '',
    }, [events, currentEvent]);

    useEffect(() => {
        setIsFetchingRules(!isLoading);
    }, [isLoading, setIsFetchingRules]);

    if (isLoading) return <SkeletonCard/>


    return (

        <Card>
            <CardHeader>
                <CardTitle className="flex flex-row">

                    Create Validation Rules For <pre><code>{event.label}</code></pre></CardTitle>
                <CardDescription>
                    Add rules for event validation. Each rule requires a name, error message, and query.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <RulesForm eventType={event.event_type} eventId={event.id}/>
            </CardContent>
        </Card>

    );
}

const RulesCard = dynamic(() => Promise.resolve(RulesCardComponent), {
    ssr: false,
    loading: () => <Loader fullscreen/>,
});

export default RulesCard;
