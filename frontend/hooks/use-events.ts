"use client";


import {useUserInfoStore} from "~/store";
import {useShallow} from "zustand/react/shallow";
import {eq, lower, useLiveQuery} from "@tanstack/react-db";
import {eventsCollection} from "~/lib/db/collections";

export function useEvents() {
    const {activeTeam} = useUserInfoStore(useShallow((state) => state));

    const {data: events, ...rest} = useLiveQuery(
        (q) => q.from({events: eventsCollection})
            .where(({events}) => eq(lower(events.teamId), activeTeam?.id)), [activeTeam?.id]);

    return {events, ...rest};
}