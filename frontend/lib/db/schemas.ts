import {z} from 'zod'
import {createInsertSchema, createSelectSchema, createUpdateSchema} from "drizzle-zod";
import {events, rules} from "~/lib/db/schema";


export const DateTimeSchema = z.union([z.string(), z.date()]).transform((val) => {
    if (!val) return val
    return typeof val === 'string' ? new Date(val) : val
}).nullable().default(null);

export const columnsSchema = z.object({
    name: z.string(),
    isReward: z.boolean().nullable().default(false),
});

export type ColumnsSchema = z.infer<typeof columnsSchema>;

const eventsSelectSchema = createSelectSchema(events);
export const eventsSchema = eventsSelectSchema.extend({
    updatedAt: z.union([z.string(), z.number(), z.date()]).transform((val) =>
        val instanceof Date ? val : new Date(val)
    ),
});

export type EventsSchema = z.infer<typeof eventsSchema>;

export const eventsInsertSchema = createInsertSchema(events);

export type EventsInsertSchema = z.infer<typeof eventsInsertSchema>;

export const eventsUpdateSchema = createUpdateSchema(events).omit({updatedAt: true, createdById: true, id: true});

export type EventsUpdateSchema = z.infer<typeof eventsUpdateSchema>;

export const rulesSchema = createSelectSchema(rules);

export type RulesSchema = z.infer<typeof rulesSchema>;

export const rulesInsertSchema = createInsertSchema(rules);

export type RulesInsertSchema = z.infer<typeof rulesInsertSchema>;


export const rulesUpdateSchema = createUpdateSchema(rules);

export type RulesUpdateSchema = z.infer<typeof rulesUpdateSchema>;

export const usersSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    disabled: z.boolean(),
    updatedAt: DateTimeSchema,
    createdAt: DateTimeSchema,
});

export type UsersSchema = z.infer<typeof usersSchema>;

export const usersInsertSchema = usersSchema.omit({
    id: true,
});

export type UsersInsertSchema = z.infer<typeof usersInsertSchema>;
