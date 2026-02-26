"use client";

import type { EventRule, EventWithRules, RewardRule } from "~/domain";
import env from "~/lib/env";

export const api = {
  events: {
    getAll: async (teamSlug: string) => {
      const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/teams/${teamSlug}/events`;
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
    getBySlug: async (slug: string) => {
      const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/events/${encodeURIComponent(slug)}`;
      const response = await fetch(url);
      if (!response.ok) return null;
      const data = await response.json();
      return (data ?? null) as EventWithRules | null;
    },
    create: async (event: EventWithRules) => {
      const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/events`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      });
      const data = await response.json();
      return data as EventWithRules;
    },
    update: async (id: string, event: EventWithRules) => {
      const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/events/${id}`;
      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      });
      const data = await response.json();
      return data as EventWithRules;
    },
    delete: async (id: string) => {
      const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/events/${id}`;
      const response = await fetch(url, {
        method: "DELETE",
      });
      const data = await response.json();
      return data as { success: boolean; id: string };
    },
    canEdit: async (slug: string) => {
      const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/events/${slug}/can-edit`;
      const response = await fetch(url);
      const data = await response.json();
      return data as { canEdit: boolean };
    },
    updateSchema: async (
      eventId: string,
      eventSchema: Record<string, unknown>,
    ) => {
      const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/events/${eventId}/schema`;
      const response = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventSchema),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.error ?? response.statusText);
      }
      return (await response.json()) as { success: boolean };
    },
    updateEventRules: async (
      eventId: string,
      rules: EventRule[],
      deletedIds: string[],
    ) => {
      const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/events/${eventId}/event-rules`;
      const response = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rules, deletedIds }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.error ?? response.statusText);
      }
      return (await response.json()) as { success: boolean };
    },
    updateRewardRules: async (
      eventId: string,
      rules: RewardRule[],
      deletedIds: string[],
    ) => {
      const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/events/${eventId}/reward-rules`;
      const response = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rules, deletedIds }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.error ?? response.statusText);
      }
      return (await response.json()) as { success: boolean };
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
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });
    return await response.json();
  },
  dbTables: {
    getAll: async () => {
      const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/db-tables`;
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
};

export default api;
