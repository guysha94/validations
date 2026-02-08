"use client";
import {Tabs, TabsContent, TabsList, TabsTrigger,} from "@/components/ui/tabs"

import RulesCard from "~/components/RulesCard";
import TestCard from "~/components/TestCard";
import Loader from "~/components/Loader";
import {useValidationsStore} from "~/store";
import {useShallow} from "zustand/react/shallow";
import SchemaForm from "~/components/forms/SchemaForm";
import dynamic from "next/dynamic";
import {eq, lower, useLiveQuery} from "@tanstack/react-db";
import {eventsCollection, rulesCollection} from "~/lib/db/collections";
import {useEffect, useMemo} from "react";
import {Tab} from "~/store/validations-store";


type Props = {
    slug: string;
}

function EventTabsComponent({slug}: Props) {


    const {
        currentTab,
        currentEvent,
        setCurrentEvent,
        setCurrentTab
    } = useValidationsStore(useShallow((state) => state));
    const {data: events = [], isLoading: isLoadingEvents} = useLiveQuery(
        (q) => q.from({events: eventsCollection})
            .where(({events}) => eq(lower(events.type), slug.toLowerCase())),
    );
    const {data: rules = [], isLoading: isLoadingRules} = useLiveQuery(
        (q) => q.from({rules: rulesCollection})
            .where(({rules}) => eq(rules.eventId, currentEvent?.id)),
    )

    const isLoading = useMemo(() => isLoadingEvents || isLoadingRules, [isLoadingEvents, isLoadingRules]);
    const event = useMemo(() => events?.find(e => e.type.toLowerCase() === slug.toLowerCase()), [events, slug]);

    useEffect(() => {
        if (isLoading) return;
        if (events.length === 0) return;
        if (!event) return;
        setCurrentEvent(event);
    }, [isLoading, events, event, setCurrentEvent]);


    return (
        <div className="flex w-full flex-col gap-6 h-full min-h-[85dvh]">
            <Tabs value={currentTab || 'schema'} className="w-full h-full flex flex-col">
                <TabsList className="w-full shrink-0">
                    <TabsTrigger className="cursor-pointer" value="schema" onClick={() => setCurrentTab('schema')}>Event
                        Schema</TabsTrigger>
                    <TabsTrigger className="cursor-pointer" value="rules" onClick={() => setCurrentTab('rules')}>Event
                        Rules</TabsTrigger>
                    <TabsTrigger className="cursor-pointer" value="test" onClick={() => setCurrentTab('test')}>Validation
                        Test</TabsTrigger>
                </TabsList>
                <TabsContent value="schema" className="flex-1 min-h-0">
                    {event && <SchemaForm event={event}/>}
                </TabsContent>
                <TabsContent value="rules" className="flex-1 min-h-0">
                    {event && <RulesCard event={event} rules={rules}/>}
                </TabsContent>
                <TabsContent value="test" className="flex-1 min-h-0">
                    <TestCard/>
                </TabsContent>
            </Tabs>
            {isLoading && <Loader fullscreen/>}
        </div>
    )
}

export const EventTabs = dynamic(() => Promise.resolve(EventTabsComponent), {
    ssr: false,
    loading: () => <Loader fullscreen/>,
});

export default EventTabs;