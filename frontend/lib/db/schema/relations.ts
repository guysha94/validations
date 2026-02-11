import {relations} from "drizzle-orm/relations";
import {
    accounts,
    eventPermissions,
    events,
    invitations,
    members,
    organizations,
    rulePermissions,
    rules,
    sessions,
    teamMembers,
    teams,
    users
} from "./schema";

export const rulesRelations = relations(rules, ({one, many}) => ({
    event: one(events, {
        fields: [rules.eventId],
        references: [events.id],
    }),
    rulePermissions: many(rulePermissions),
}));

export const eventsRelations = relations(events, ({one, many}) => ({
    team: one(teams, {
        fields: [events.teamId],
        references: [teams.id],
    }),
    createdBy: one(users, {
        fields: [events.createdById],
        references: [users.id],
    }),
    rules: many(rules),
    eventPermissions: many(eventPermissions),
}));

export const eventPermissionsRelations = relations(eventPermissions, ({one}) => ({
    event: one(events, {
        fields: [eventPermissions.eventId],
        references: [events.id],
    }),
    user: one(users, {
        fields: [eventPermissions.userId],
        references: [users.id],
    }),
}));

export const rulePermissionsRelations = relations(rulePermissions, ({one}) => ({
    rule: one(rules, {
        fields: [rulePermissions.ruleId],
        references: [rules.id],
    }),
    user: one(users, {
        fields: [rulePermissions.userId],
        references: [users.id],
    }),
}));


export const usersRelations = relations(users, ({many}) => ({
    sessions: many(sessions),
    accounts: many(accounts),
    teamMembers: many(teamMembers),
    members: many(members),
    invitations: many(invitations),
    eventPermissions: many(eventPermissions),
    rulePermissions: many(rulePermissions),
}));

export const sessionsRelations = relations(sessions, ({one}) => ({
    users: one(users, {
        fields: [sessions.userId],
        references: [users.id],
    }),
}));

export const accountsRelations = relations(accounts, ({one}) => ({
    users: one(users, {
        fields: [accounts.userId],
        references: [users.id],
    }),
}));

export const organizationsRelations = relations(organizations, ({many}) => ({
    teams: many(teams),
    members: many(members),
    invitations: many(invitations),
}));

export const teamsRelations = relations(teams, ({one, many}) => ({
    organization: one(organizations, {
        fields: [teams.organizationId],
        references: [organizations.id],
    }),
    teamMembers: many(teamMembers),
    events: many(events),
}));

export const teamMembersRelations = relations(teamMembers, ({one}) => ({
    teams: one(teams, {
        fields: [teamMembers.teamId],
        references: [teams.id],
    }),
    users: one(users, {
        fields: [teamMembers.userId],
        references: [users.id],
    }),
}));

export const membersRelations = relations(members, ({one}) => ({
    organizations: one(organizations, {
        fields: [members.organizationId],
        references: [organizations.id],
    }),
    users: one(users, {
        fields: [members.userId],
        references: [users.id],
    }),
}));

export const invitationsRelations = relations(invitations, ({one}) => ({
    organizations: one(organizations, {
        fields: [invitations.organizationId],
        references: [organizations.id],
    }),
    users: one(users, {
        fields: [invitations.inviterId],
        references: [users.id],
    }),
}));