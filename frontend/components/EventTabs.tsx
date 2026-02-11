"use client";
import {Tabs, TabsContent, TabsList, TabsTrigger,} from "@/components/ui/tabs"

import RulesCard from "~/components/RulesCard";
import TestCard from "~/components/TestCard";
import Loader from "~/components/Loader";
import {useValidationsStore} from "~/store";
import {useShallow} from "zustand/react/shallow";
import SchemaForm from "~/components/forms/SchemaForm";
import EventSettingsForm from "~/components/forms/EventSettingsForm";
import dynamic from "next/dynamic";
import {useQuery} from "@tanstack/react-query";
import {api} from "~/lib/api";
import {eq, lower, useLiveQuery} from "@tanstack/react-db";
import {eventsCollection, rulesCollection} from "~/lib/db/collections";
import {useCallback, useEffect, useMemo} from "react";
import {SelectEvent} from "~/domain";
import type {EventsSchema} from "~/lib/db/schemas";
import {Tab} from "~/store/validations-store";
import {useRouter} from "next/navigation";
import {ROOT_ROUTE} from "~/lib/constants";


type Props = {
    slug: string;
}

function EventTabsComponent({slug}: Props) {

    const router = useRouter();
    const {
        currentTab,
        currentEvent,
        setCurrentEvent,
        setCurrentTab,
        setRules,
    } = useValidationsStore(useShallow((state) => state));
    const {data: events = [], isLoading: isLoadingEvents} = useLiveQuery(
        (q) => q.from({events: eventsCollection})
            .where(({events}) => eq(lower(events.type), slug.toLowerCase())),
    );
    const {data: rules = [], isLoading: isLoadingRules} = useLiveQuery(
        (q) => q.from({rules: rulesCollection})
            .where(({rules}) => eq(rules.eventId, currentEvent?.id)),
    );

    const {data: eventBySlug, isLoading: isLoadingSlug, isFetched: slugFetched} = useQuery({
        queryKey: ["event-by-slug", slug],
        queryFn: () => api.events.getBySlug(slug),
        enabled: !!slug,
    });

    const isLoading = useMemo(
        () => isLoadingEvents || isLoadingRules || isLoadingSlug,
        [isLoadingEvents, isLoadingRules, isLoadingSlug],
    );
    const event = useMemo(() => {
        const fromList = events?.find((e) => e.type.toLowerCase() === slug.toLowerCase());
        if (fromList) return fromList;
        if (eventBySlug && typeof eventBySlug === "object" && "id" in eventBySlug) return eventBySlug as SelectEvent;
        return undefined;
    }, [events, slug, eventBySlug]);

    const {data: canEditData} = useQuery({
        queryKey: ["event-can-edit", slug],
        queryFn: () => api.events.canEdit(slug),
        enabled: !!slug && !!event,
    });
    const canEdit = useMemo(() => canEditData?.canEdit ?? false, [canEditData]);
    const handleChange = useCallback((tab: Tab) => setCurrentTab(tab), [setCurrentTab]);

    useEffect(() => {
        if (isLoading) return;
        if (events.length === 0) return;
        if (!event) return;
        setCurrentEvent(event as SelectEvent);
    }, [isLoading, events, event, setCurrentEvent]);

    // Only redirect when we've confirmed the event doesn't exist (fetch by slug), not when the list is still loading
    useEffect(() => {
        if (!slug || !slugFetched || isLoadingSlug) return;
        if (eventBySlug === null) {
            router.push(ROOT_ROUTE);
        }
    }, [slug, slugFetched, isLoadingSlug, eventBySlug, router]);

    useEffect(() => {
        if (!event?.type) return;
        setRules(event.type, rules);
    }, [event, rules, setRules]);


    return (
        <div className="flex w-full flex-col gap-6 h-full min-h-[85dvh]">
            <Tabs value={currentTab || 'schema'} className="w-full h-full flex flex-col">
                <TabsList className="w-full shrink-0">
                    <TabsTrigger className="cursor-pointer" value="schema" onClick={() => handleChange('schema')}>Event
                        Schema</TabsTrigger>
                    <TabsTrigger className="cursor-pointer" value="rules" onClick={() => handleChange('rules')}>Event
                        Rules</TabsTrigger>
                    <TabsTrigger className="cursor-pointer" value="test" onClick={() => handleChange('test')}>Validation
                        Test</TabsTrigger>
                    <TabsTrigger className="cursor-pointer" value="settings"
                                 onClick={() => handleChange('settings')}>Settings</TabsTrigger>
                </TabsList>
                <TabsContent value="schema" className="flex-1 min-h-0">
                    {event && <SchemaForm event={event as EventsSchema} readOnly={!canEdit}/>}
                </TabsContent>
                <TabsContent value="rules" className="flex-1 min-h-0">
                    {event && <RulesCard event={event as EventsSchema} readOnly={!canEdit}/>}
                </TabsContent>
                <TabsContent value="test" className="flex-1 min-h-0">
                    <TestCard readOnly={!canEdit}/>
                </TabsContent>
                <TabsContent value="settings" className="flex-1 min-h-0">
                    {event && (
                        canEdit ? (
                            <EventSettingsForm event={event} slug={slug}/>
                        ) : (
                            <p className="text-muted-foreground text-sm">You don&apos;t have permission to edit this
                                event.</p>
                        )
                    )}
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