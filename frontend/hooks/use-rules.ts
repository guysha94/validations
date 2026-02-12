"use client";


import {useValidationsStore} from "~/store";
import {useShallow} from "zustand/react/shallow";
import {eq, lower, useLiveQuery} from "@tanstack/react-db";
import {rulesCollection} from "~/lib/db/collections";

export function useRules() {
    const {currentEvent} = useValidationsStore(useShallow((state) => state));

    const {data: rules, isPending, ...rest} = useLiveQuery(
        (q) => q.from({rules: rulesCollection})
            .where(({rules}) => eq(lower(rules.eventId), currentEvent?.id)), [currentEvent?.id]);

    return {rules, isReady: !isPending && currentEvent != null, ...rest};
}