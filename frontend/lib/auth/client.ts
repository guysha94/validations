"use client";
import {createAuthClient} from "better-auth/react";
import {adminClient, organizationClient} from "better-auth/client/plugins"
import {ac, admin, member, owner, viewer} from "./permissions"

export const authClient = createAuthClient({
    baseURL: typeof window !== "undefined" ? window.location.origin : "",
    plugins: [
        organizationClient({
            allowUserToCreateOrganization: false,
            teams: {enabled: true},
            ac,
            roles: {
                owner,
                admin,
                member,
                viewer,
            }
        }),
        adminClient(),
    ]
});
