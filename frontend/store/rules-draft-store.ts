import {createJSONStorage, persist} from "zustand/middleware";
import {create} from "./storage";

export type RuleDraft = {
    id: string;
    eventId: string;
    name: string;
    description?: string | null;
    errorMessage: string;
    query: string;
    enabled: boolean;
    editAccess?: string;
};

type DraftEntry = {
    rules: RuleDraft[];
    removedIds: string[];
    updatedAt?: number;
};

type RulesDraftState = {
    drafts: Record<string, DraftEntry>;
    getDraft: (eventId: string) => RuleDraft[] | null;
    getRemovedIds: (eventId: string) => string[];
    setDraft: (eventId: string, rules: RuleDraft[]) => void;
    addToRemoved: (eventId: string, ruleId: string) => void;
    clearDraft: (eventId: string) => void;
    hasDraft: (eventId: string) => boolean;
};

export const useRulesDraftStore = create<RulesDraftState>()(
    persist(
        (set) => ({
            drafts: {},
            getDraft: (eventId: string) =>
                useRulesDraftStore.getState().drafts[eventId]?.rules ?? null,
            getRemovedIds: (eventId: string) =>
                useRulesDraftStore.getState().drafts[eventId]?.removedIds ?? [],
            setDraft: (eventId: string, rules: RuleDraft[]) => {
                set((state) => {
                    const current = state.drafts[eventId];
                    return {
                        drafts: {
                            ...state.drafts,
                            [eventId]: {
                                rules,
                                removedIds: current?.removedIds ?? [],
                                updatedAt: Date.now(),
                            },
                        },
                    };
                });
            },
            addToRemoved: (eventId: string, ruleId: string) => {
                set((state) => {
                    const current = state.drafts[eventId];
                    const removedIds = Array.from(new Set( [...(current?.removedIds ?? []), ruleId]));
                    return {
                        drafts: {
                            ...state.drafts,
                            [eventId]: {
                                rules: current?.rules ?? [],
                                removedIds,
                                updatedAt: Date.now(),
                            },
                        },
                    };
                });
            },
            clearDraft: (eventId: string) => {
                set((state) => {
                    const { [eventId]: _, ...rest } = state.drafts;
                    return { drafts: rest };
                });
            },
            hasDraft: (eventId: string) => {
                const entry = useRulesDraftStore.getState().drafts[eventId];
                return !!entry?.rules?.length || !!entry?.removedIds?.length;
            },
        }),
        {
            name: "rules-draft",
            storage: createJSONStorage(() => sessionStorage),
        }
    )
);
