"use client";
import { useQuery } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import slugify from "slugify";
import { useShallow } from "zustand/react/shallow";
import type { EventRule, EventWithRules, Result, RewardRule } from "~/domain";
import api from "~/lib/api";
import { useStore } from "~/store";

export type ContextType = {
  events: EventWithRules[];
  activeEvent?: EventWithRules | null | undefined;
  updateEventSchema: (
    newSchema: Record<string, any>,
  ) => Promise<Result<boolean>>;
  updateEventRules: (newRules: EventRule[]) => Promise<Result<boolean>>;
  updateRewardRules: (newRules: RewardRule[]) => Promise<Result<boolean>>;
  isPending: boolean;
  isFetching: boolean;
  isLoading: boolean;
  error?: Error | null;
  refetch: () => void;
};

export const eventsContext = createContext<ContextType | undefined>(undefined);

type Props = {
  teamSlug?: string;
};

export function EventsContextProvider({
  children,
  teamSlug,
}: PropsWithChildren<Props>) {
  const pathname = usePathname();
  const {
    data: events = [],
    isFetching,
    isPending,
    refetch,
    error,
  } = useQuery<EventWithRules[]>({
    queryKey: [`events-${teamSlug}`, teamSlug],
    queryFn: () => api.events.getAll(teamSlug!),
    enabled: !!teamSlug,
  });
  const { activeEvent, setActiveEvent } = useStore(
    useShallow((state) => state),
  );

  const updateEventSchema = useCallback(
    async (newSchema: Record<string, unknown>): Promise<Result<boolean>> => {
      if (!activeEvent) return { error: new Error("No active event") };
      const current = activeEvent.eventSchema ?? {};
      if (JSON.stringify(current) === JSON.stringify(newSchema)) {
        return { data: true };
      }
      try {
        await api.events.updateSchema(activeEvent.id, newSchema);
        await refetch();
        return { data: true };
      } catch (err) {
        console.error("Error updating event schema:", err);
        const error =
          err instanceof Error ? err : new Error("An unknown error occurred");
        return { error };
      }
    },
    [activeEvent, refetch],
  );

  const updateEventRules = useCallback(
    async (newRules: EventRule[]): Promise<Result<boolean>> => {
      if (!activeEvent) return { error: new Error("No active event") };
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
      if (!hasChanges) return { data: true };

      try {
        await api.events.updateEventRules(activeEvent.id, newRules, deletedIds);
        await refetch();
        return { data: true };
      } catch (err) {
        console.error("Error updating event rules:", err);
        const error =
          err instanceof Error ? err : new Error("An unknown error occurred");
        return { error };
      }
    },
    [activeEvent, refetch],
  );

  const updateRewardRules = useCallback(
    async (newRules: RewardRule[]): Promise<Result<boolean>> => {
      if (!activeEvent) return { error: new Error("No active event") };
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
      if (!hasChanges) return { data: true };

      try {
        await api.events.updateRewardRules(
          activeEvent.id,
          newRules,
          deletedIds,
        );
        await refetch();
        return { data: true };
      } catch (err) {
        console.error("Error updating reward rules:", err);
        const error =
          err instanceof Error ? err : new Error("An unknown error occurred");
        return { error };
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
        refetch,
        isFetching,
        error,
        activeEvent,
        updateEventSchema,
        updateEventRules,
        updateRewardRules,
      }}
    >
      {children}
    </eventsContext.Provider>
  );
}
