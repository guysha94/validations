import {z} from 'zod'


export const DateTimeSchema = z.union([z.string(), z.date()]).transform((val) => {
    if (!val) return val
    return typeof val === 'string' ? new Date(val) : val
}).nullable().default(null);

export const columnsSchema = z.object({
    name: z.string(),
    isReward: z.boolean().nullable().default(false),
});

export type ColumnsSchema = z.infer<typeof columnsSchema>;

export const eventsSchema = z.object({
    id: z.string(),
    type: z.string(),
    label: z.string().nullable().default(null),
    icon: z.string().nullable().default(null),
    eventSchema: z.record(z.string(), columnsSchema.array()).default({}),
    updatedAt: DateTimeSchema,
});

export type EventsSchema = z.infer<typeof eventsSchema>;

export const eventsInsertSchema = eventsSchema.omit({
    id: true,
});

export type EventsInsertSchema = z.infer<typeof eventsInsertSchema>;

export const EventsUpdateSchema = eventsInsertSchema.partial();

export type EventsUpdateSchema = z.infer<typeof EventsUpdateSchema>;

export const rulesSchema = z.object({
    id: z.string(),
    eventId: z.string(),
    name: z.string(),
    errorMessage: z.string(),
    query: z.string(),
    enabled: z.boolean().default(true),
    updatedAt: DateTimeSchema,
    createdAt: DateTimeSchema,
});

export type RulesSchema = z.infer<typeof rulesSchema>;

export const rulesInsertSchema = rulesSchema.omit({
    id: true,
});

export type RulesInsertSchema = z.infer<typeof rulesInsertSchema>;


export const RulesUpdateSchema = rulesInsertSchema.partial();

export type RulesUpdateSchema = z.infer<typeof RulesUpdateSchema>;

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
