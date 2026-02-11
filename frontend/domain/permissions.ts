import type {User} from "./user";

export type RoleOption = "owner" | "admin" | "member" | "viewer";
export type Role = RoleOption | RoleOption[];

export type UserWithRoles = User & {roles: RoleOption[]};

export type Action = "read" | "create" | "update" | "delete";

/**
 * ABAC resource definitions.
 * Each resource has a dataType (attributes used for policy evaluation).
 */
export type Permissions = {
    event: {
        action: Action;
        dataType: {eventId: string};
    };
    rule: {
        action: Action;
        dataType: {ruleId: string; eventId?: string};
    };
    organization: {
        action: Action;
        dataType: {organizationId: string};
    };
};

/**
 * Role capability matrix.
 * viewer: read-only for all resources.
 * member: read + create/update on assigned resources.
 * admin: full org scope.
 * owner: full org scope + delete.
 */
const ROLE_CAPABILITIES: Record<
    RoleOption,
    Partial<Record<keyof Permissions, Action[]>>
> = {
    owner: {
        event: ["read", "create", "update", "delete"],
        rule: ["read", "create", "update", "delete"],
        organization: ["read", "create", "update", "delete"],
    },
    admin: {
        event: ["read", "create", "update", "delete"],
        rule: ["read", "create", "update", "delete"],
        organization: ["read", "create", "update", "delete"],
    },
    member: {
        event: ["read", "create", "update"],
        rule: ["read", "create", "update"],
        organization: ["read"],
    },
    viewer: {
        event: ["read"],
        rule: ["read"],
        organization: ["read"],
    },
};

/**
 * ABAC permission check.
 * Evaluates if a user with given roles can perform the action on the resource.
 * Note: Resource-level checks (event_permissions, rule_permissions) must be
 * done separately via canEditEvent/canEditRule; this is for role-level capability.
 */
export function hasPermission<Resource extends keyof Permissions>(
    user: UserWithRoles,
    resource: Resource,
    action: Permissions[Resource]["action"],
    _data?: Permissions[Resource]["dataType"]
): boolean {
    const roles = Array.isArray(user.roles) ? user.roles : [user.roles];
    if (roles.length === 0) return false;

    for (const role of roles) {
        const normalized = (typeof role === "string" ? role : String(role))
            .toLowerCase() as RoleOption;
        if (!(normalized in ROLE_CAPABILITIES)) continue;

        const allowed = ROLE_CAPABILITIES[normalized][resource];
        if (allowed?.includes(action)) return true;
    }
    return false;
}

/**
 * Check if user has at least read capability (not viewer-only for edit).
 */
export function canEdit(resourceRole: RoleOption | string | null): boolean {
    if (!resourceRole) return false;
    const role = String(resourceRole).toLowerCase() as RoleOption;
    return role === "owner" || role === "admin" || role === "member";
}

/**
 * Check if user is viewer-only (read-only).
 */
export function isViewerOnly(resourceRole: RoleOption | string | null): boolean {
    if (!resourceRole) return false;
    return String(resourceRole).toLowerCase() === "viewer";
}
