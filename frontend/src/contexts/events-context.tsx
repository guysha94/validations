"use client";
import {useMutation, useQuery} from "@tanstack/react-query";
import {usePathname} from "next/navigation";
import {createContext, type PropsWithChildren, useCallback, useEffect, useMemo,} from "react";
import slugify from "slugify";
import {useShallow} from "zustand/react/shallow";
import type {EventRule, EventWithRules, Result, RewardRule} from "~/domain";
import api from "~/lib/api";
import {useStore} from "~/store";
import {getQueryClient} from "~/lib/query-client";

export type CreateEventInput = {
    type: string;
    label: string;
    icon: string;
    editAccess?: string;
};

export type ContextType = {
    events: EventWithRules[];
    activeEvent?: EventWithRules | null | undefined;
    createEvent: (input: CreateEventInput) => Promise<EventWithRules | undefined>;
    deleteEvent: (eventId: string) => Promise<{ success: boolean }>;
    updateEventSchema: (newSchema: Record<string, any>) => Promise<{ success: boolean }>;
    updateEventRules: (newRules: EventRule[]) => Promise<Result<boolean>>;
    updateRewardRules: (newRules: RewardRule[]) => Promise<Result<boolean>>;
    isPending: boolean;
    isCreatePending: boolean;
    isUpdateSchemaPending: boolean;
    isDeletePending: boolean;
    isFetching: boolean;
    isLoading: boolean;
    error?: Error | null;
    createError?: Error | null;
    updateSchemaError?: Error | null;
    deleteError?: Error | null;
    refetch: () => void;
};

export const eventsContext = createContext<ContextType | undefined>(undefined);


export function EventsContextProvider({children,}: PropsWithChildren) {
    const {activeTeam, activeEvent, setActiveEvent} = useStore(useShallow(state => state));
    const teamSlug = useMemo(() => activeTeam?.id, [activeTeam]);
    const queryClient = getQueryClient();

    const pathname = usePathname();
    const {
        data: events = [],
        isFetching,
        isPending,
        refetch,
        error,
    } = useQuery<EventWithRules[]>({
        queryKey: ["events"],
        queryFn: () => api.events.getAll(teamSlug!),
        enabled: !!teamSlug?.length,
    });
    const {error: createError, isPending: isCreatePending, mutateAsync: mutateCreate} = useMutation({
        mutationFn: ({teamSlug, input}: { teamSlug: string, input: CreateEventInput }) => api.events.create(teamSlug, {
            type: input.type,
            label: input.label,
            icon: input.icon,
            editAccess: input.editAccess ?? "public",
        }),
        onSettled: async () => {
            await queryClient.invalidateQueries({queryKey: ["events"]});
            await refetch()
        },
    });
    const {isPending: isDeletePending, mutateAsync: mutateDelete, error: deleteError} = useMutation({
        mutationFn: (eventId: string) => api.events.delete(eventId),
        onSettled: async () => {
            await queryClient.invalidateQueries({queryKey: ["events"]});
            await refetch()
        },
    });

    const {isPending: isUpdateSchemaPending, mutateAsync: mutateUpdateSchema, error: updateSchemaError} = useMutation({
        mutationFn: ({eventId, newSchema}: {
            eventId: string,
            newSchema: Record<string, unknown>
        }) => api.events.updateSchema(eventId, newSchema),
        onSettled: async () => {
            await queryClient.invalidateQueries({queryKey: ["events"]});
            await refetch()
        },
    });

    const createEvent = useCallback(
        async (input: CreateEventInput) => {
            if (!teamSlug) return;
            return await mutateCreate({teamSlug, input})
        },
        [teamSlug, mutateCreate],);

    const deleteEvent = useCallback(
        (eventId: string) => mutateDelete(eventId),
        [mutateDelete]
    );

    const updateEventSchema = useCallback(
        async (newSchema: Record<string, unknown>) => mutateUpdateSchema({
            eventId: activeEvent!.id,
            newSchema,
        }),
        [activeEvent, mutateUpdateSchema],);

    const updateEventRules = useCallback(
        async (newRules: EventRule[]): Promise<Result<boolean>> => {
            if (!activeEvent) return {error: new Error("No active event")};
            const existing = activeEvent.eventRules ?? [];
            const existingIds = new Set(existing.map((r) => r.id).filter(Boolean));
            const newIds = new Set(
                newRules.map((r) => r.id).filter((id) => id && !id.startsWith("new-")),
            );
            const deletedIds = [...existingIds].filter((id) => !newIds.has(id));

            const hasChanges =
                deletedIds.length > 0 ||
                newRules.length !== existing.length ||
                newRules.some((r, _i) => {
                    const ex = existing.find(
                        (e) => e.id === r.id && !r.id?.startsWith("new-"),
                    );
                    if (!ex) return true;
                    return (
                        ex.name !== r.name ||
                        ex.query !== r.query ||
                        ex.errorMessage !== r.errorMessage ||
                        ex.enabled !== r.enabled ||
                        ex.description !== r.description
                    );
                });
            if (!hasChanges) return {data: true};

            try {
                await api.events.updateEventRules(activeEvent.id, newRules, deletedIds);
                await refetch();
                return {data: true};
            } catch (err) {
                console.error("Error updating event rules:", err);
                const error =
                    err instanceof Error ? err : new Error("An unknown error occurred");
                return {error};
            }
        },
        [activeEvent, refetch],
    );

    const updateRewardRules = useCallback(
        async (newRules: RewardRule[]): Promise<Result<boolean>> => {
            if (!activeEvent) return {error: new Error("No active event")};
            const existing = activeEvent.rewardRules ?? [];
            const existingIds = new Set(existing.map((r) => r.id).filter(Boolean));
            const newIds = new Set(
                newRules.map((r) => r.id).filter((id) => id && !id.startsWith("new-")),
            );
            const deletedIds = [...existingIds].filter((id) => !newIds.has(id));

            const hasChanges =
                deletedIds.length > 0 ||
                newRules.length !== existing.length ||
                newRules.some((r, _i) => {
                    const ex = existing.find(
                        (e) => e.id === r.id && !r.id?.startsWith("new-"),
                    );
                    if (!ex) return true;
                    return (
                        ex.name !== r.name ||
                        ex.enabled !== r.enabled ||
                        JSON.stringify(ex.queries) !== JSON.stringify(r.queries) ||
                        ex.tab !== r.tab ||
                        ex.column !== r.column
                    );
                });
            if (!hasChanges) return {data: true};

            try {
                await api.events.updateRewardRules(
                    activeEvent.id,
                    newRules,
                    deletedIds,
                );
                await refetch();
                return {data: true};
            } catch (err) {
                console.error("Error updating reward rules:", err);
                const error =
                    err instanceof Error ? err : new Error("An unknown error occurred");
                return {error};
            }
        },
        [activeEvent, refetch],
    );

    useEffect(() => {
        if (isFetching) return;
        const eventFromPath = events?.find((event) =>
            pathname.toLowerCase().includes(slugify(event.type || "").toLowerCase()),
        );
        setActiveEvent(eventFromPath || null);
    }, [pathname, events, isFetching, setActiveEvent]);

    const isLoading = useMemo(
        () => isPending || isFetching,
        [isPending, isFetching],
    );

    return (
        <eventsContext.Provider
            value={{
                events,
                isLoading,
                isPending,
                isCreatePending,
                isUpdateSchemaPending,
                isDeletePending,
                refetch,
                isFetching,
                error,
                createError,
                updateSchemaError,
                deleteError,
                activeEvent,
                createEvent,
                deleteEvent,
                updateEventSchema,
                updateEventRules,
                updateRewardRules,
            }}
        >
            {children}
        </eventsContext.Provider>
    );
}
