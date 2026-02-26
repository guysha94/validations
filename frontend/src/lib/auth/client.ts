"use client";
import { adminClient, organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { ac, admin, member, owner } from "./permissions";

export const authClient = createAuthClient({
  baseURL: typeof window !== "undefined" ? window.location.origin : "",
  plugins: [
    organizationClient({
      allowUserToCreateOrganization: false,
      teams: { enabled: true },
      ac,
      roles: {
        owner,
        admin,
        member,
      },
      schema: {
        team: {
          additionalFields: {
            slug: {
              type: "string",
              unique: true,
              required: false,
              input: false,
            },
          },
        },
      },
    }),
    adminClient(),
  ],
});
