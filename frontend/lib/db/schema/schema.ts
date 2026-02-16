import {
    index,
    json,
    mysqlTable,
    primaryKey,
    text,
    timestamp,
    unique,
    uniqueIndex,
    varchar
} from "drizzle-orm/mysql-core"
import {sql} from "drizzle-orm"
import {slugVarchar, tinyintBool, uuidBinary} from "~/lib/utils";

export const events = mysqlTable("events", {
        id: uuidBinary().default(sql`(uuid_to_bin(uuid ()))`).notNull().primaryKey(),
        teamId: varchar("team_id", {length: 36}).notNull().references(() => teams.id, {onDelete: "cascade"}),
        createdById: varchar("created_by_id", {length: 36}).references(() => users.id, {onDelete: "set null"}),
        editAccess: varchar("edit_access", {length: 32}).default("restricted").notNull(), // "public" | "restricted": public = any team member can edit; restricted = only owner + admins
        type: varchar({length: 255}).notNull(),
        label: varchar({length: 255}).notNull(),
        icon: varchar({length: 255}).notNull(),
        eventSchema: json("event_schema").default({}).notNull(),
        updatedAt: timestamp("updated_at", {mode: 'date'})
            .notNull()
            .defaultNow()
            .onUpdateNow(),
    },
    (table) => [
        primaryKey({columns: [table.id], name: "events_id"}),
        index("idx_events_team_id").on(table.teamId),
        unique("unique_type_per_team").on(table.teamId, table.type),
    ]);

export const rules = mysqlTable("rules", {
        id: uuidBinary().default(sql`(uuid_to_bin(uuid ()))`).notNull().primaryKey(),
        eventId: uuidBinary("event_id", {length: 16}).notNull().references(() => events.id, {onDelete: "cascade"}),
        editAccess: varchar("edit_access", {length: 32}).default("restricted").notNull(), // "public" | "restricted": inherits event semantics when restricted
        name: varchar({length: 255}).notNull(),
        description: text(),
        errorMessage: text("error_message").notNull(),
        query: text().notNull(),
        enabled: tinyintBool().default(true).notNull(),
        updatedAt: timestamp("updated_at", {mode: 'date'})
            .notNull()
            .defaultNow()
            .onUpdateNow(),
    },
    (table) => [
        index("idx_rules_on_event_id").on(table.eventId),
        primaryKey({columns: [table.id], name: "rules_id"}),
        unique("unique_name_per_event").on(table.eventId, table.name),
    ]);


export const users = mysqlTable("users", {
    id: varchar("id", {length: 36}).primaryKey(),
    name: varchar("name", {length: 255}).notNull(),
    email: varchar("email", {length: 255}).notNull().unique(),
    emailVerified: tinyintBool("email_verified").default(false).notNull(),
    image: text("image"),
    createdAt: timestamp("created_at", {mode: 'date'}).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", {mode: 'date'})
        .notNull()
        .defaultNow()
        .onUpdateNow(),
    role: text("role"),
    banned: tinyintBool("banned").default(false),
    banReason: text("ban_reason"),
    banExpires: timestamp("ban_expires", {mode: 'date'}),
});

export const sessions = mysqlTable(
    "sessions",
    {
        id: varchar("id", {length: 36}).primaryKey(),
        expiresAt: timestamp("expires_at", {mode: 'date'}).notNull(),
        token: varchar("token", {length: 255}).notNull().unique(),
        createdAt: timestamp("created_at", {mode: 'date'}).notNull().defaultNow(),
        updatedAt: timestamp("updated_at", {mode: 'date'})
            .notNull()
            .defaultNow()
            .onUpdateNow(),
        ipAddress: text("ip_address"),
        userAgent: text("user_agent"),
        userId: varchar("user_id", {length: 36})
            .notNull()
            .references(() => users.id, {onDelete: "cascade"}),
        activeOrganizationId: text("active_organization_id"),
        activeTeamId: text("active_team_id"),
        impersonatedBy: text("impersonated_by"),
    },
    (table) => [index("sessions_userId_idx").on(table.userId)],
);

export const accounts = mysqlTable(
    "accounts",
    {
        id: varchar("id", {length: 36}).primaryKey(),
        accountId: text("account_id").notNull(),
        providerId: text("provider_id").notNull(),
        userId: varchar("user_id", {length: 36})
            .notNull()
            .references(() => users.id, {onDelete: "cascade"}),
        accessToken: text("access_token"),
        refreshToken: text("refresh_token"),
        idToken: text("id_token"),
        accessTokenExpiresAt: timestamp("access_token_expires_at", {mode: 'date'}),
        refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {mode: 'date'}),
        scope: text("scope"),
        password: text("password"),
        createdAt: timestamp("created_at", {mode: 'date'}).notNull().defaultNow(),
        updatedAt: timestamp("updated_at", {mode: 'date'})
            .notNull()
            .defaultNow()
            .onUpdateNow(),
    },
    (table) => [index("accounts_userId_idx").on(table.userId)],
);

export const verifications = mysqlTable(
    "verifications",
    {
        id: varchar("id", {length: 36}).primaryKey(),
        identifier: varchar("identifier", {length: 255}).notNull(),
        value: text("value").notNull(),
        expiresAt: timestamp("expires_at", {mode: 'date'}).notNull(),
        createdAt: timestamp("created_at", {mode: 'date'}).notNull().defaultNow(),
        updatedAt: timestamp("updated_at", {mode: 'date'})
            .notNull()
            .defaultNow()
            .onUpdateNow(),
    },
    (table) => [index("verifications_identifier_idx").on(table.identifier)],
);

export const organizations = mysqlTable(
    "organizations",
    {
        id: varchar("id", {length: 36}).primaryKey(),
        name: varchar("name", {length: 255}).notNull(),
        slug: varchar("slug", {length: 255}).notNull().unique(),
        logo: text("logo"),
        createdAt: timestamp("created_at", {mode: 'date'}).notNull().defaultNow(),
        metadata: text("metadata"),
    },
    (table) => [uniqueIndex("organizations_slug_uidx").on(table.slug)],
);

export const teams = mysqlTable(
    "teams",
    {
        id: varchar("id", {length: 36}).primaryKey(),
        name: varchar("name", {length: 255}).notNull().unique(),
        slug: slugVarchar("slug", {length: 255}).notNull().unique().generatedAlwaysAs(
            sql.raw(`TRIM(BOTH '-' FROM REPLACE(REPLACE(LOWER(name), ' ', '-'),'--','-'))`)
        ),
        organizationId: varchar("organization_id", {length: 36})
            .notNull()
            .references(() => organizations.id, {onDelete: "cascade"}),
        createdAt: timestamp("created_at", {mode: 'date'}).notNull().defaultNow(),
        updatedAt: timestamp("updated_at", {mode: 'date'})
            .notNull()
            .defaultNow()
            .onUpdateNow(),
    },
    (table) => [index("teams_organizationId_idx").on(table.organizationId)],
);

export const teamMembers = mysqlTable(
    "team_members",
    {
        id: varchar("id", {length: 36}).primaryKey(),
        teamId: varchar("team_id", {length: 36})
            .notNull()
            .references(() => teams.id, {onDelete: "cascade"}),
        userId: varchar("user_id", {length: 36})
            .notNull()
            .references(() => users.id, {onDelete: "cascade"}),
        role: varchar("role", {length: 64}).default("member").notNull(), // member | admin (team-level)
        createdAt: timestamp("created_at", {mode: 'date'}).notNull().defaultNow(),
    },
    (table) => [
        index("teamMembers_teamId_idx").on(table.teamId),
        index("teamMembers_userId_idx").on(table.userId),
    ],
);

export const members = mysqlTable(
    "members",
    {
        id: varchar("id", {length: 36}).primaryKey(),
        organizationId: varchar("organization_id", {length: 36})
            .notNull()
            .references(() => organizations.id, {onDelete: "cascade"}),
        userId: varchar("user_id", {length: 36})
            .notNull()
            .references(() => users.id, {onDelete: "cascade"}),
        role: varchar("role", {length: 255}).default("member").notNull(),
        createdAt: timestamp("created_at", {mode: 'date'}).notNull().defaultNow(),
    },
    (table) => [
        index("members_organizationId_idx").on(table.organizationId),
        index("members_userId_idx").on(table.userId),
    ],
);

export const invitations = mysqlTable(
    "invitations",
    {
        id: varchar("id", {length: 36}).primaryKey(),
        organizationId: varchar("organization_id", {length: 36})
            .notNull()
            .references(() => organizations.id, {onDelete: "cascade"}),
        email: varchar("email", {length: 255}).notNull(),
        role: varchar("role", {length: 255}),
        teamId: varchar("team_id", {length: 255}),
        status: varchar("status", {length: 255}).default("pending").notNull(),
        expiresAt: timestamp("expires_at", {mode: 'date'}).notNull(),
        createdAt: timestamp("created_at", {mode: 'date'}).notNull().defaultNow(),
        inviterId: varchar("inviter_id", {length: 36})
            .notNull()
            .references(() => users.id, {onDelete: "cascade"}),
    },
    (table) => [
        index("invitations_organizationId_idx").on(table.organizationId),
        index("invitations_email_idx").on(table.email),
    ],
);

// Event-level permissions: owner can manage event and its rules + grant/revoke; member can edit; viewer read-only.
export const eventPermissions = mysqlTable(
    "event_permissions",
    {
        eventId: uuidBinary("event_id", {length: 16})
            .notNull()
            .references(() => events.id, {onDelete: "cascade"}),
        userId: varchar("user_id", {length: 36})
            .notNull()
            .references(() => users.id, {onDelete: "cascade"}),
        role: varchar("role", {length: 32}).notNull(), // owner | member | viewer
        createdAt: timestamp("created_at", {mode: 'date'}).notNull().defaultNow(),
    },
    (table) => [
        primaryKey({columns: [table.eventId, table.userId], name: "event_permissions_pk"}),
        index("event_permissions_user_id_idx").on(table.userId),
    ],
);

// Rule-level permissions; same role semantics. Omit row to inherit from event or use for overrides.
export const rulePermissions = mysqlTable(
    "rule_permissions",
    {
        ruleId: uuidBinary("rule_id", {length: 16})
            .notNull()
            .references(() => rules.id, {onDelete: "cascade"}),
        userId: varchar("user_id", {length: 36})
            .notNull()
            .references(() => users.id, {onDelete: "cascade"}),
        role: varchar("role", {length: 32}).notNull(), // owner | member | viewer
        createdAt: timestamp("created_at", {mode: 'date'}).notNull().defaultNow(),
    },
    (table) => [
        primaryKey({columns: [table.ruleId, table.userId], name: "rule_permissions_pk"}),
        index("rule_permissions_user_id_idx").on(table.userId),
    ],
);

// Audit logs for events, rules, and validation requests
export const auditLogs = mysqlTable(
    "audit_logs",
    {
        id: uuidBinary().default(sql`(uuid_to_bin(uuid()))`).notNull().primaryKey(),
        teamSlug: varchar("team_slug", {length: 255}).notNull(),
        createdAt: timestamp("created_at", {mode: 'date'}).notNull().defaultNow(),
        action: varchar("action", {length: 32}).notNull(),
        entityType: varchar("entity_type", {length: 32}).notNull(),
        entityId: varchar("entity_id", {length: 64}),
        actorId: varchar("actor_id", {length: 36}),
        actorType: varchar("actor_type", {length: 16}).notNull(),
        source: varchar("source", {length: 16}).notNull(),
        payload: json("payload"),
        metadata: json("metadata"),
    },
    (table) => [
        index("idx_audit_created_at").on(table.createdAt),
        index("idx_audit_entity").on(table.entityType, table.entityId),
        index("idx_audit_actor").on(table.actorId),
        index("idx_audit_action").on(table.action),
        index("idx_audit_team_slug").on(table.teamSlug),
    ],
);