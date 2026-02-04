"use client";

import {env} from "~/env/client";
import {
    RulesInsertSchema,
    RulesSchema,
    RulesUpdateSchema,
    EventsInsertSchema,
    EventsSchema,
    EventsUpdateSchema
} from "~/db/schemas";


export const api = {
    events: {
        getAll: async () => {
            const url = `${env.NEXT_PUBLIC_API_BASE_URL}/events`;
            console.log("Fetching events from:", url);
            const response = await fetch(url);
            const data = await response.json();
            console.log("Fetched events:", data);
            return data as EventsSchema[];
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
        validate: async (formData: { url: string, eventType: string }) => {
            const url = `${env.NEXT_PUBLIC_API_BASE_URL}/validate`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });
            return await response.json();
        }
    },
    rules: {
        getAll: async () => {
            const url = `${env.NEXT_PUBLIC_API_BASE_URL}/rules`;
            const response = await fetch(url);
            const data = await response.json();
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
        updateOne: async (id: string, rules: RulesUpdateSchema) => {
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
        updateMany: async (updates: Array<{ id: string; changes: RulesUpdateSchema }>) => {
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
};