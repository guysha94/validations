import "server-only";
import { eq } from "drizzle-orm";
import { validationsDb } from "~/lib/db";
import { eventPermissions, events, rulePermissions, rules, users } from "~/lib/db/schema";

const EDIT_ROLES = ["owner", "member"] as const;
const VIEW_ROLES = ["owner", "member", "viewer"] as const;

/**
 * User can edit the event if they are creator, have event_permission owner/member, or are global admin.
 * editAccess (public vs restricted) is not used here; both require one of the above.
 * Restricting "public" to team members would require teamMembers join — not implemented here.
 */
export async function canEditEvent(
    eventId: string,
    userId: string
): Promise<boolean> {
    const [event] = await validationsDb
        .select()
        .from(events)
        .where(eq(events.id, eventId));
    if (!event) return false;

    if (event.createdById === userId) return true;

    const [user] = await validationsDb
        .select({ role: users.role })
        .from(users)
        .where(eq(users.id, userId));
    if (user?.role === "admin") return true;

    const perms = await validationsDb
        .select()
        .from(eventPermissions)
        .where(eq(eventPermissions.eventId, eventId));
    return perms.some(
        (p) => p.userId === userId && EDIT_ROLES.includes(p.role as (typeof EDIT_ROLES)[number])
    );
}

/**
 * User can view the event if they have any event_permission (owner, member, viewer) or are global admin.
 */
export async function canViewEvent(eventId: string, userId: string): Promise<boolean> {
    const [event] = await validationsDb
        .select()
        .from(events)
        .where(eq(events.id, eventId));
    if (!event) return false;

    if (event.createdById === userId) return true;

    const [user] = await validationsDb
        .select({ role: users.role })
        .from(users)
        .where(eq(users.id, userId));
    if (user?.role === "admin") return true;

    const perms = await validationsDb
        .select()
        .from(eventPermissions)
        .where(eq(eventPermissions.eventId, eventId));
    return perms.some(
        (p) => p.userId === userId && VIEW_ROLES.includes(p.role as (typeof VIEW_ROLES)[number])
    );
}

/**
 * Rule permission defaults to event permission when no rule_permissions row exists.
 */
export async function canEditRule(ruleId: string, userId: string): Promise<boolean> {
    const rulePerms = await validationsDb
        .select()
        .from(rulePermissions)
        .where(eq(rulePermissions.ruleId, ruleId));
    const hasRulePerm = rulePerms.some(
        (p) => p.userId === userId && EDIT_ROLES.includes(p.role as (typeof EDIT_ROLES)[number])
    );
    if (hasRulePerm) return true;

    const [rule] = await validationsDb
        .select({ eventId: rules.eventId })
        .from(rules)
        .where(eq(rules.id, ruleId));
    if (!rule) return false;
    return canEditEvent(rule.eventId, userId);
}

/**
 * Rule view permission: check rule_permissions or fall back to event.
 */
export async function canViewRule(ruleId: string, userId: string): Promise<boolean> {
    const rulePerms = await validationsDb
        .select()
        .from(rulePermissions)
        .where(eq(rulePermissions.ruleId, ruleId));
    const hasRulePerm = rulePerms.some(
        (p) => p.userId === userId && VIEW_ROLES.includes(p.role as (typeof VIEW_ROLES)[number])
    );
    if (hasRulePerm) return true;

    const [rule] = await validationsDb
        .select({ eventId: rules.eventId })
        .from(rules)
        .where(eq(rules.id, ruleId));
    if (!rule) return false;
    return canViewEvent(rule.eventId, userId);
}
