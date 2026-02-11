import {createAccessControl} from "better-auth/plugins/access";

/**
 * Statement must match organization plugin expectations:
 * - organization, member, invitation, team (singular), ac
 * - events, rules are custom resources for app-level checks
 */
const statement = {
    organization: ["read", "update", "delete"],
    member: ["create", "update", "delete"],
    invitation: ["read", "create", "cancel"],
    team: ["read", "create", "update", "delete"],
    ac: ["read", "create", "update", "delete"],
    events: ["read", "create", "update", "delete"],
    rules: ["read", "create", "update", "delete"],
} as const;

export const ac = createAccessControl(statement);

export const viewer = ac.newRole({
    organization: ["read"],
    member: [],
    invitation: [],
    team: ["read"],
    ac: ["read"],
    events: ["read"],
    rules: ["read"],
});

export const member = ac.newRole({
    organization: ["read"],
    member: [],
    invitation: [],
    team: ["read"],
    ac: ["read"],
    events: ["read", "create", "update"],
    rules: ["read", "create", "update"],
});

export const admin = ac.newRole({
    organization: ["read", "update"],
    member: ["create", "update", "delete"],
    invitation: ["read", "create", "cancel"],
    team: ["read", "create", "update", "delete"],
    ac: ["read", "create", "update", "delete"],
    events: ["read", "create", "update", "delete"],
    rules: ["read", "create", "update", "delete"],
});

export const owner = ac.newRole({
    organization: ["read", "update", "delete"],
    member: ["create", "update", "delete"],
    invitation: ["read", "create", "cancel"],
    team: ["read", "create", "update", "delete"],
    ac: ["read", "create", "update", "delete"],
    events: ["read", "create", "update", "delete"],
    rules: ["read", "create", "update", "delete"],
});
