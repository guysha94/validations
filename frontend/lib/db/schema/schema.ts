import {index, json, mysqlTable, primaryKey, text, timestamp, unique, varchar} from "drizzle-orm/mysql-core"
import {sql} from "drizzle-orm"
import {tinyintBool, uuidBinary} from "~/lib/utils";

export const events = mysqlTable("events", {
        id: uuidBinary().default(sql`(uuid_to_bin(uuid ()))`).notNull().primaryKey(),
        type: varchar({length: 255}).notNull(),
        label: varchar({length: 255}).notNull(),
        icon: varchar({length: 255}).notNull(),
        eventSchema: json("event_schema").default({}).notNull(),
        updatedAt: timestamp("updated_at", {mode: 'string'}).defaultNow().onUpdateNow().notNull(),
    },
    (table) => [
        primaryKey({columns: [table.id], name: "events_id"}),
        unique("label").on(table.label),
        unique("type").on(table.type),
    ]);

export const rules = mysqlTable("rules", {
        id: uuidBinary().default(sql`(uuid_to_bin(uuid ()))`).notNull().primaryKey(),
        eventId: uuidBinary("event_id", {length: 16}).notNull().references(() => events.id, {onDelete: "cascade"}),
        name: varchar({length: 255}).notNull(),
        description: text(),
        errorMessage: text("error_message").notNull(),
        query: text().notNull(),
        enabled: tinyintBool().default(true).notNull(),
        updatedAt: timestamp("updated_at", {mode: 'string'}).defaultNow().onUpdateNow().notNull(),
    },
    (table) => [
        index("idx_rules_on_event_id").on(table.eventId),
        primaryKey({columns: [table.id], name: "rules_id"}),
        unique("unique_name_per_event").on(table.eventId, table.name),
    ]);

