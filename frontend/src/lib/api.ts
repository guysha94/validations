"use client";

import type {
  AuditLog,
  Event,
  EventRule,
  EventWithRules,
  PaginatedResponse,
  RewardRule,
} from "~/domain";
import env from "~/lib/env";

const base = () => env.NEXT_PUBLIC_API_BASE_URL;

export const api = {
  events: {
    getAll: async (teamSlug: string) => {
      console.log(`Fetching events for team: ${teamSlug}`);
      const url = `${base()}/api/teams/${teamSlug}/events`;
      const response = await fetch(url);
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(
          (err as { error?: string })?.error ?? response.statusText,
        );
      }
      const data = await response.json();
      return data as EventWithRules[];
    },
    create: async (teamSlug: string, event: Omit<Event, "id" | "teamId"> & { teamId?: string }) => {
      const url = `${base()}/api/teams/${teamSlug}/events`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(event),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error((err as { error?: string })?.error ?? response.statusText);
      }
      const data = await response.json();
      return data as EventWithRules;
    },
    getById: async (eventId: string, options?: { withRules?: boolean; withTeam?: boolean }) => {
      const params = new URLSearchParams();
      if (options?.withRules) params.set("withRules", "true");
      if (options?.withTeam) params.set("withTeam", "true");
      const qs = params.toString();
      const url = `${base()}/api/events/${encodeURIComponent(eventId)}${qs ? `?${qs}` : ""}`;
      const response = await fetch(url);
      if (!response.ok) return null;
      const data = await response.json();
      return (data ?? null) as EventWithRules | null;
    },
    getBySlug: async (slug: string) => api.events.getById(slug, { withRules: true }),
    update: async (eventId: string, event: Partial<Event>) => {
      const url = `${base()}/api/events/${encodeURIComponent(eventId)}`;
      const response = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(event),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error((err as { error?: string })?.error ?? response.statusText);
      }
      const data = await response.json();
      return data as EventWithRules;
    },
    patch: async (eventId: string, event: Partial<Event>) => {
      const url = `${base()}/api/events/${encodeURIComponent(eventId)}`;
      const response = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(event),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error((err as { error?: string })?.error ?? response.statusText);
      }
      const data = await response.json();
      return data as EventWithRules;
    },
    delete: async (eventId: string) => {
      const url = `${base()}/api/events/${encodeURIComponent(eventId)}`;
      const response = await fetch(url, { method: "DELETE" });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error((err as { error?: string })?.error ?? response.statusText);
      }
      return {success: true};
    },
    updateEventRules: async (eventId: string, rules: EventRule[], deletedIds: string[] = []) =>
      api.events.eventRules.upsert(eventId, rules, deletedIds),
    updateRewardRules: async (eventId: string, rules: RewardRule[], deletedIds: string[] = []) =>
      api.events.rewardRules.upsert(eventId, rules, deletedIds),
    updateSchema: async (
      eventId: string,
      eventSchema: Record<string, unknown>,
    ) => {
      const url = `${base()}/api/events/${encodeURIComponent(eventId)}/schema`;
      const response = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventSchema),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error((err as { error?: string })?.error ?? response.statusText);
      }
      return (await response.json()) as { success: boolean };
    },
    eventRules: {
      getAll: async (eventId: string) => {
        const url = `${base()}/api/events/${encodeURIComponent(eventId)}/event-rules`;
        const response = await fetch(url);
        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error((err as { error?: string })?.error ?? response.statusText);
        }
        return (await response.json()) as EventRule[];
      },
      getById: async (eventId: string, ruleId: string) => {
        const url = `${base()}/api/events/${encodeURIComponent(eventId)}/event-rules/${encodeURIComponent(ruleId)}`;
        const response = await fetch(url);
        if (!response.ok) return null;
        return (await response.json()) as EventRule | null;
      },
      create: async (eventId: string, rule: Omit<EventRule, "id" | "eventId" | "createdAt" | "updatedAt">) => {
        const url = `${base()}/api/events/${encodeURIComponent(eventId)}/event-rules`;
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(rule),
        });
        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error((err as { error?: string })?.error ?? response.statusText);
        }
        return (await response.json()) as EventRule;
      },
      update: async (eventId: string, ruleId: string, rule: Partial<EventRule>) => {
        const url = `${base()}/api/events/${encodeURIComponent(eventId)}/event-rules/${encodeURIComponent(ruleId)}`;
        const response = await fetch(url, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(rule),
        });
        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error((err as { error?: string })?.error ?? response.statusText);
        }
        return (await response.json()) as EventRule;
      },
      patch: async (eventId: string, ruleId: string, rule: Partial<EventRule>) => {
        const url = `${base()}/api/events/${encodeURIComponent(eventId)}/event-rules/${encodeURIComponent(ruleId)}`;
        const response = await fetch(url, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(rule),
        });
        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error((err as { error?: string })?.error ?? response.statusText);
        }
        return (await response.json()) as EventRule;
      },
      delete: async (eventId: string, ruleId: string) => {
        const url = `${base()}/api/events/${encodeURIComponent(eventId)}/event-rules/${encodeURIComponent(ruleId)}`;
        const response = await fetch(url, { method: "DELETE" });
        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error((err as { error?: string })?.error ?? response.statusText);
        }
        return (await response.json()) as { message: string };
      },
      upsert: async (eventId: string, rules: EventRule[], deletedIds: string[] = []) => {
        const url = `${base()}/api/events/${encodeURIComponent(eventId)}/event-rules`;
        const response = await fetch(url, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rules, deletedIds }),
        });
        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error((err as { error?: string })?.error ?? response.statusText);
        }
        return (await response.json()) as { success: boolean };
      },
    },
    rewardRules: {
      getAll: async (eventId: string) => {
        const url = `${base()}/api/events/${encodeURIComponent(eventId)}/reward-rules`;
        const response = await fetch(url);
        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error((err as { error?: string })?.error ?? response.statusText);
        }
        return (await response.json()) as RewardRule[];
      },
      getById: async (eventId: string, ruleId: string) => {
        const url = `${base()}/api/events/${encodeURIComponent(eventId)}/reward-rules/${encodeURIComponent(ruleId)}`;
        const response = await fetch(url);
        if (!response.ok) return null;
        return (await response.json()) as RewardRule | null;
      },
      create: async (eventId: string, rule: Omit<RewardRule, "id" | "eventId" | "createdAt" | "updatedAt">) => {
        const url = `${base()}/api/events/${encodeURIComponent(eventId)}/reward-rules`;
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(rule),
        });
        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error((err as { error?: string })?.error ?? response.statusText);
        }
        return (await response.json()) as RewardRule;
      },
      update: async (eventId: string, ruleId: string, rule: Partial<RewardRule>) => {
        const url = `${base()}/api/events/${encodeURIComponent(eventId)}/reward-rules/${encodeURIComponent(ruleId)}`;
        const response = await fetch(url, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(rule),
        });
        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error((err as { error?: string })?.error ?? response.statusText);
        }
        return (await response.json()) as RewardRule;
      },
      patch: async (eventId: string, ruleId: string, rule: Partial<RewardRule>) => {
        const url = `${base()}/api/events/${encodeURIComponent(eventId)}/reward-rules/${encodeURIComponent(ruleId)}`;
        const response = await fetch(url, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(rule),
        });
        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error((err as { error?: string })?.error ?? response.statusText);
        }
        return (await response.json()) as RewardRule;
      },
      delete: async (eventId: string, ruleId: string) => {
        const url = `${base()}/api/events/${encodeURIComponent(eventId)}/reward-rules/${encodeURIComponent(ruleId)}`;
        const response = await fetch(url, { method: "DELETE" });
        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error((err as { error?: string })?.error ?? response.statusText);
        }
        return (await response.json()) as { message: string };
      },
      upsert: async (eventId: string, rules: RewardRule[], deletedIds: string[] = []) => {
        const url = `${base()}/api/events/${encodeURIComponent(eventId)}/reward-rules`;
        const response = await fetch(url, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rules, deletedIds }),
        });
        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error((err as { error?: string })?.error ?? response.statusText);
        }
        return (await response.json()) as { success: boolean };
      },
    },
  },
  audits: {
    getPaginated: async (
      teamSlug: string,
      params: {
        pageIndex?: number;
        pageSize?: number;
        q?: string;
        sorting?: Array<{ id: string; desc?: boolean }>;
      },
    ) => {
      const searchParams = new URLSearchParams();
      searchParams.set("pageIndex", String(params.pageIndex ?? 0));
      searchParams.set("pageSize", String(params.pageSize ?? 10));
      if (params.q) searchParams.set("q", params.q);
      if (params.sorting?.length)
        searchParams.set("sorting", JSON.stringify(params.sorting));

      const url = `${base()}/api/teams/${encodeURIComponent(teamSlug)}/audits?${searchParams.toString()}`;
      const response = await fetch(url);
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(
          (err as { error?: string })?.error ?? response.statusText,
        );
      }
      return (await response.json()) as PaginatedResponse<AuditLog>;
    },
  },
  dbTables: {
    getAll: async () => {
      const url = `${base()}/api/db-tables`;
      const response = await fetch(url);
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(
          (err as { error?: string })?.error ?? response.statusText,
        );
      }
      const data = await response.json();
      return data as Record<string, string[]>;
    },
  },
  validate: async (formData: {
    url: string;
    eventType: string;
    team: string;
  }) => {
    const url = `${env.NEXT_PUBLIC_VALIDATION_BASE_URL}/api/validate`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    return await response.json();
  },
};

export default api;

