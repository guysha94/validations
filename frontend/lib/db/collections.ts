"use client";
import {createCollection} from '@tanstack/react-db'
import {queryCollectionOptions} from '@tanstack/query-db-collection'
import {eventsSchema, rulesSchema} from './schemas'
import {api} from "~/lib/api";
import {getQueryClient} from "~/lib/query-client";


export const eventsCollection = createCollection(
    queryCollectionOptions({
        id: 'events',
        schema: eventsSchema,
        queryClient: getQueryClient(),
        queryKey: ['events'],
        getKey: (item) => item.id,
        queryFn: () => api.events.getAll(),
        onInsert: ({transaction}) => {
            const mutation = transaction.mutations[0];
            return api.events.create(mutation.modified);
        },
        onUpdate: ({transaction}) => {
            const mutation = transaction.mutations[0];
            const { updatedAt: _u, id: _id, teamId: _t, createdById: _c, ...rest } = mutation.original as Record<string, unknown>;
            const changes = { ...rest, ...mutation.changes } as Parameters<typeof api.events.update>[1];
            return api.events.update(mutation.original.id, changes);
        },
        onDelete: async ({transaction}) => {
            const {original} = transaction.mutations[0];
            return await api.events.delete(original.id);
        }
    }),
);

export const rulesCollection = createCollection(
    queryCollectionOptions({
        id: 'rules',
        schema: rulesSchema,
        queryClient: getQueryClient(),
        queryKey: ['rules'],
        getKey: (item) => item.id,
        queryFn: () => api.rules.getAll(),
        onInsert: ({transaction}) => {
            return api.rules.create(transaction.mutations.map(m => m.modified));
        },
        onUpdate: async ({transaction}) => {

            if (transaction.mutations.length === 0) return;
            if (transaction.mutations.length === 1) {
                const mutation = transaction.mutations[0];
                return api.rules.updateOne(mutation.original.id, mutation.changes);
            }

            const updates = transaction.mutations.map(m => ({
                id: m.key,
                changes: m.changes
            }))
            return await api.rules.updateMany(updates);
        },
        onDelete: async ({transaction}) => {
            const {original} = transaction.mutations[0];
            return await api.rules.delete(original.id);
        },
    }));