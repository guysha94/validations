import { relations } from "drizzle-orm/relations";
import {
  accounts,
  eventRules,
  events,
  invitations,
  members,
  organizations,
  rewardRules,
  sessions,
  teamMembers,
  teams,
  users,
} from "./schema";

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  events: many(events),
  invitations: many(invitations),
  members: many(members),
  sessions: many(sessions),
  teamMembers: many(teamMembers),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  user: one(users, {
    fields: [events.createdById],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [events.teamId],
    references: [teams.id],
  }),
  event_rules: many(eventRules),
  reward_rules: many(rewardRules),
}));

export const teamsRelations = relations(teams, ({ one, many }) => ({
  events: many(events),
  teamMembers: many(teamMembers),
  organization: one(organizations, {
    fields: [teams.organizationId],
    references: [organizations.id],
  }),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
  user: one(users, {
    fields: [invitations.inviterId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [invitations.organizationId],
    references: [organizations.id],
  }),
}));

export const organizationsRelations = relations(organizations, ({ many }) => ({
  invitations: many(invitations),
  members: many(members),
  teams: many(teams),
}));

export const membersRelations = relations(members, ({ one }) => ({
  organization: one(organizations, {
    fields: [members.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [members.userId],
    references: [users.id],
  }),
}));

export const eventRulesRelations = relations(eventRules, ({ one, many }) => ({
  event: one(events, {
    fields: [eventRules.eventId],
    references: [events.id],
  }),
}));

export const rewardRulesRelations = relations(rewardRules, ({ one, many }) => ({
  event: one(events, {
    fields: [rewardRules.eventId],
    references: [events.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
}));
