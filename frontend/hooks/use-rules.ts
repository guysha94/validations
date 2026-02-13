"use client";
import {useCallback} from "react";
import {useValidationsStore} from "~/store";
import {useShallow} from "zustand/react/shallow";
import {eq, lower, useLiveQuery} from "@tanstack/react-db";
import {rulesCollection} from "~/lib/db/collections";
import {SelectRule} from "~/domain";
import {createRules, deleteRules, updateRules} from "~/lib/db/client-crud";

export function useRules() {
    const {currentEvent} = useValidationsStore(useShallow((state) => state));

    const {data: rules, isReady, ...rest} = useLiveQuery(
        (q) => q.from({rules: rulesCollection})
            .where(({rules}) => eq(lower(rules.eventId), currentEvent?.id)), [currentEvent?.id]);

    const upsert = useCallback(async (newRules: SelectRule[]) => {
        const persistedRulesId = new Set((rules ?? []).map(r => r.id));
        const {toInsert, toUpdate} = newRules.reduce((acc, r) => {
            if (!persistedRulesId.has(r.id)) acc.toInsert.push({
                ...r,
                updatedAt: new Date(),
                eventId: currentEvent!.id
            });
            else acc.toUpdate.push({...r, updatedAt: new Date(), eventId: currentEvent!.id});
            return acc;
        }, {toInsert: [] as SelectRule[], toUpdate: [] as SelectRule[]});
        const actualChanged = toUpdate?.filter(r => {
            const original = rules?.find(rule => rule.id === r.id);
            if(!original) return false;
            return original.name !== r.name || original.errorMessage !== r.errorMessage || original.query !== r.query || original.enabled !== r.enabled;
        });
        console.log("actualChanged:", actualChanged);
        const tasks: Promise<unknown>[] = [];
        if (!!toInsert?.length) {
            tasks.push(createRules(...toInsert));
        }
        if (!!actualChanged?.length) {
            tasks.push(updateRules(...actualChanged));
        }
        if (!!tasks?.length) {
            await Promise.all(tasks);
        }
    }, [rules, currentEvent]);

    const deleteMany = useCallback(async (ids: string[]) => {
        const deletedSet = new Set(ids);
        const toDelete = rules?.filter(r => deletedSet.has(r.id)) ?? [];
        if (!!toDelete?.length) {
            await deleteRules(...toDelete.map(r => r.id));
        }
    }, [rules]);


    return {rules, isReady: isReady && !!currentEvent, ...rest, upsert, deleteMany};
}