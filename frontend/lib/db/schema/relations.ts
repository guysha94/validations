import { relations } from "drizzle-orm/relations";
import { events, rules } from "./schema";

export const rulesRelations = relations(rules, ({one}) => ({
	event: one(events, {
		fields: [rules.eventId],
		references: [events.id]
	}),
}));

export const eventsRelations = relations(events, ({many}) => ({
	rules: many(rules),
}));