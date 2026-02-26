import { sql } from "drizzle-orm";
import {
  index,
  json,
  mysqlTable,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/mysql-core";
import { uuidv7 } from "uuidv7";
import {
  jsonArrayColumn,
  jsonObjectColumn,
  slugVarchar,
  tinyintBool,
} from "./db-types";

export const accounts = mysqlTable(
  "accounts",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", {
      mode: "date",
    }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
      mode: "date",
    }),
    scope: text(),
    password: text(),
    createdAt: timestamp("created_at", { mode: "date" })
      .default(sql`(now()
                                                                       )`)
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .default(sql`(now()
                                                                       )`)
      .onUpdateNow()
      .notNull(),
  },
  (table) => [index("accounts_userId_idx").on(table.userId)],
);

export const auditLogs = mysqlTable(
  "audit_logs",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    createdAt: timestamp("created_at", { mode: "date" })
      .default(sql`(now()
                                                                       )`)
      .notNull(),
    action: varchar({ length: 32 }).notNull(),
    entityType: varchar("entity_type", { length: 32 }).notNull(),
    entityId: varchar("entity_id", { length: 64 }),
    actorId: varchar("actor_id", { length: 36 }),
    actorType: varchar("actor_type", { length: 16 }).notNull(),
    source: varchar({ length: 16 }).notNull(),
    payload: json(),
    metadata: json(),
    teamSlug: varchar("team_slug", { length: 255 }).notNull(),
  },
  (table) => [
    index("idx_audit_created_at").on(table.createdAt),
    index("idx_audit_entity").on(table.entityType, table.entityId),
    index("idx_audit_actor").on(table.actorId),
    index("idx_audit_action").on(table.action),
    index("idx_audit_team_slug").on(table.teamSlug),
    index("idx_audit_full_text_search").on(
      table.action,
      table.entityType,
      table.entityId,
      table.actorId,
      table.actorType,
      table.source,
    ),
  ],
);

export const events = mysqlTable(
  "events",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    teamId: varchar("team_id", { length: 36 })
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    createdById: varchar("created_by_id", { length: 36 }).references(
      () => users.id,
      { onDelete: "set null" },
    ),
    editAccess: varchar("edit_access", { length: 32 })
      .default("public")
      .notNull(),
    type: varchar({ length: 255 }).notNull(),
    label: varchar({ length: 255 }).notNull(),
    icon: varchar({ length: 255 }).notNull(),
    eventSchema: jsonObjectColumn("event_schema").default({}).notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .default(
        sql`(now()
                    )`,
      )
      .onUpdateNow()
      .notNull(),
  },
  (table) => [
    index("idx_events_team_id").on(table.teamId),
    unique("unique_type_per_team").on(table.teamId, table.type),
  ],
);

export const invitations = mysqlTable(
  "invitations",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    organizationId: varchar("organization_id", { length: 36 })
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    email: varchar({ length: 255 }).notNull(),
    role: varchar({ length: 255 }),
    teamId: varchar("team_id", { length: 36 }).references(() => teams.id, {
      onDelete: "set null",
    }),
    status: varchar({ length: 255 }).default("pending").notNull(),
    expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
    createdAt: timestamp("created_at", { mode: "date" })
      .default(sql`(now()
                                                                       )`)
      .notNull(),
    inviterId: varchar("inviter_id", { length: 36 }).references(
      () => users.id,
      { onDelete: "set null" },
    ),
  },
  (table) => [
    index("invitations_organizationId_idx").on(table.organizationId),
    index("invitations_email_idx").on(table.email),
  ],
);

export const members = mysqlTable(
  "members",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    organizationId: varchar("organization_id", { length: 36 })
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 255 }).default("member").notNull(),
    createdAt: timestamp("created_at", { mode: "date" })
      .notNull()
      .default(sql.raw("now()")),
  },
  (table) => [
    index("members_organizationId_idx").on(table.organizationId),
    index("members_userId_idx").on(table.userId),
  ],
);

export const organizations = mysqlTable(
  "organizations",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: slugVarchar("slug", { length: 255 }).notNull(),
    logo: text(),
    createdAt: timestamp("created_at", { mode: "date" })
      .default(sql`(now()
                                                                       )`)
      .notNull(),
    metadata: json("metadata").default({}),
  },
  (table) => [
    unique("organizations_slug_unique").on(table.slug),
    unique("organizations_slug_uidx").on(table.slug),
  ],
);

export const eventRules = mysqlTable(
  "event_rules",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    eventId: varchar("event_id", { length: 36 })
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    description: text(),
    errorMessage: text("error_message").notNull(),
    query: text().default(""),
    enabled: tinyintBool().default(true).notNull(),
    editAccess: varchar("edit_access", { length: 32 })
      .default("restricted")
      .notNull(),
    createdAt: timestamp("created_at", { mode: "date" })
      .notNull()
      .default(sql.raw("now()")),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .default(sql.raw("now()"))
      .onUpdateNow()
      .notNull(),
  },
  (table) => [
    index("idx_rules_on_event_id").on(table.eventId),
    unique("unique_name_per_event").on(table.eventId, table.name),
  ],
);

/** Per-query metadata for reward rules. Stored in queries JSON column. */
export type RewardRuleQueryItem = {
  query: string;
  errorMessage: string;
  description?: string;
};

export const rewardRules = mysqlTable(
  "reward_rules",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    eventId: varchar("event_id", { length: 36 })
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    name: varchar({ length: 255 }).notNull(),
    enabled: tinyintBool().default(true).notNull(),
    editAccess: varchar("edit_access", { length: 32 })
      .default("restricted")
      .notNull(),
    queries: jsonArrayColumn("queries")
      .$type<RewardRuleQueryItem[]>()
      .default([]),
    tab: varchar({ length: 255 }).default(""),
    column: varchar({ length: 255 }).default(""),
    createdAt: timestamp("created_at", { mode: "date" })
      .notNull()
      .default(sql.raw("now()")),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .default(sql.raw("now()"))
      .onUpdateNow()
      .notNull(),
  },
  (table) => [
    index("idx_rules_on_event_id").on(table.eventId),
    unique("unique_name_per_event").on(table.eventId, table.name),
  ],
);

export const sessions = mysqlTable(
  "sessions",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
    token: varchar({ length: 255 }).notNull(),
    createdAt: timestamp("created_at", { mode: "date" })
      .default(sql`(now()
                                                                       )`)
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .default(sql`(now()
                                                                       )`)
      .onUpdateNow()
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    activeOrganizationId: varchar("active_organization_id", {
      length: 36,
    }).references(() => organizations.id, { onDelete: "set null" }),
    activeTeamId: varchar("active_team_id", { length: 36 }).references(
      () => teams.id,
      { onDelete: "set null" },
    ),
    impersonatedBy: text("impersonated_by"),
  },
  (table) => [
    index("sessions_userId_idx").on(table.userId),
    unique("sessions_token_unique").on(table.token),
  ],
);

export const teamMembers = mysqlTable(
  "team_members",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    teamId: varchar("team_id", { length: 36 })
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: varchar({ length: 64 }).default("member").notNull(),
    createdAt: timestamp("created_at", { mode: "date" })
      .default(sql`(now()
                                                                       )`)
      .notNull(),
  },
  (table) => [
    index("teamMembers_teamId_idx").on(table.teamId),
    index("teamMembers_userId_idx").on(table.userId),
  ],
);

export const teams = mysqlTable(
  "teams",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    name: varchar({ length: 255 }).notNull(),
    slug: slugVarchar({ length: 255 })
      .notNull()
      .generatedAlwaysAs(
        sql`trim(both _utf8mb4\'-\' from replace(replace(lower(\`name\`),_utf8mb4\' \',_utf8mb4\'-\'),_utf8mb4\'--\',_utf8mb4\'-\'))`,
        { mode: "virtual" },
      ),
    organizationId: varchar("organization_id", { length: 36 })
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { mode: "date" })
      .default(sql`(now()
                                                                       )`)
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .default(sql`(now()
                                                                       )`)
      .onUpdateNow()
      .notNull(),
  },
  (table) => [
    index("teams_organizationId_idx").on(table.organizationId),
    unique("teams_name_unique").on(table.name),
    unique("teams_slug_unique").on(table.slug),
  ],
);

export const users = mysqlTable(
  "users",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    name: varchar({ length: 255 }).notNull(),
    email: varchar({ length: 255 }).notNull(),
    emailVerified: tinyintBool("email_verified").default(false).notNull(),
    image: text(),
    createdAt: timestamp("created_at", { mode: "date" })
      .default(sql`(now()
                                                                       )`)
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .default(sql`(now()
                                                                       )`)
      .onUpdateNow()
      .notNull(),
    role: text(),
    banned: tinyintBool().default(false),
    banReason: text("ban_reason"),
    banExpires: timestamp("ban_expires", { mode: "date" }),
  },
  (table) => [unique("users_email_unique").on(table.email)],
);

export const verifications = mysqlTable(
  "verifications",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    identifier: varchar("identifier", { length: 255 }).notNull(),
    value: text().notNull(),
    expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
    createdAt: timestamp("created_at", { mode: "date" })
      .default(sql`(now()
                                                                       )`)
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .default(sql`(now()
                                                                       )`)
      .onUpdateNow()
      .notNull(),
  },
  (table) => [index("verifications_identifier_idx").on(table.identifier)],
);

// export const passkeys = mysqlTable("passkeys", {
//     id: uuidv7Binary().notNull().$defaultFn(() => uuidv7()),
//     name: varchar({length: 255}),
//     publicKey: text().notNull(),
//     userId: uuidv7Binary("user_id").notNull().references(() => users.id, {onDelete: "cascade"}),
//     credentialID: text().notNull(),
//     counter:int("counter").notNull().default(0),
//     deviceType: varchar({length: 255}),
//     backedUp: tinyintBool().default(false),
//     transports:text("transports"),
//     createdAt: timestamp("created_at", {mode: 'date'}).default(sql`(now())`).notNull(),
//     aaguid: text("aaguid"),
// },
//     (table) => [
//         index("passkeys_userId_idx").on(table.userId),
//         primaryKey({columns: [table.id], name: "passkeys_id"}),
//         unique("passkeys_credentialID_unique").on(table.credentialID),
//     ]);
