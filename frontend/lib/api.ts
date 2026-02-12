"use client";

import {env} from "~/env/client";
import {
    EventsInsertSchema,
    EventsSchema,
    EventsUpdateSchema,
    RulesInsertSchema,
    RulesSchema,
    rulesUpdateSchema
} from "~/lib/db/schemas";


export const api = {
    events: {
        getAll: async () => {
            const url = `${env.NEXT_PUBLIC_API_BASE_URL}/events`;
            const response = await fetch(url);
            const data = await response.json();
            return data as EventsSchema[];
        },
        getBySlug: async (slug: string) => {
            const url = `${env.NEXT_PUBLIC_API_BASE_URL}/events/${encodeURIComponent(slug)}`;
            const response = await fetch(url);
            if (!response.ok) return null;
            const data = await response.json();
            return (data ?? null) as EventsSchema | null;
        },
        create: async (event: EventsInsertSchema) => {
            const url = `${env.NEXT_PUBLIC_API_BASE_URL}/events`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(event),
            });
            const data = await response.json();
            return data as EventsSchema;
        },
        update: async (id: string, event: EventsUpdateSchema) => {
            const url = `${env.NEXT_PUBLIC_API_BASE_URL}/events/${id}`;
            console.log("Updating event at:", url, "with data:", event);
            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(event),
            });
            const data = await response.json();
            return data as EventsSchema;
        },
        delete: async (id: string) => {
            const url = `${env.NEXT_PUBLIC_API_BASE_URL}/events/${id}`;
            const response = await fetch(url, {
                method: 'DELETE',
            });
            const data = await response.json();
            return data as { success: boolean; id: string };
        },
        canEdit: async (slug: string) => {
            const url = `${env.NEXT_PUBLIC_API_BASE_URL}/events/${slug}/can-edit`;
            const response = await fetch(url);
            const data = await response.json();
            return data as { canEdit: boolean };
        },
    },
    rules: {
        getAll: async () => {
            const url = `${env.NEXT_PUBLIC_API_BASE_URL}/rules`;
            const response = await fetch(url);
            const data = await response.json();
            console.log("Fetched rules:", data);
            return data as RulesSchema[];
        },
        create: async (rules: RulesInsertSchema | Array<RulesInsertSchema>) => {
            const url = `${env.NEXT_PUBLIC_API_BASE_URL}/rules`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(rules),
            });
            const data = await response.json();
            return data as RulesSchema;
        },
        updateOne: async (id: string, rules: rulesUpdateSchema) => {
            const url = `${env.NEXT_PUBLIC_API_BASE_URL}/rules/${id}`;
            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(rules),
            });
            const data = await response.json();
            return data as RulesSchema;
        },
        updateMany: async (updates: Array<{ id: string; changes: rulesUpdateSchema }>) => {
            const url = `${env.NEXT_PUBLIC_API_BASE_URL}/rules`;
            console.log(JSON.stringify(updates))
            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updates),
            });
            const data = await response.json();
            return data as RulesSchema[];
        },
        delete: async (id: string) => {
            const url = `${env.NEXT_PUBLIC_API_BASE_URL}/rules/${id}`;
            const response = await fetch(url, {
                method: 'DELETE',
            });
            const data = await response.json();
            return data as { success: boolean; id: string };
        }
    },
    validate: async (formData: { url: string, eventType: string, team: string }) => {
        const url = `${env.NEXT_PUBLIC_VALIDATION_BASE_URL}/api/validate`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
        });
        return await response.json();
    }
};