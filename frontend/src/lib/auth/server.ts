import {render} from "@react-email/render";
import {betterAuth} from "better-auth";
import {drizzleAdapter} from "better-auth/adapters/drizzle";
import {APIError, createAuthMiddleware} from "better-auth/api";
import {nextCookies} from "better-auth/next-js";
import {admin as adminPlugin, organization} from "better-auth/plugins";
import {revalidateTag} from "next/cache";
import nodemailer from "nodemailer";
import {uuidv7} from "uuidv7";
import {
    addMemberToOrganization,
    addMemberToTeam,
    countOrganization,
    countUsers,
    getActiveOrganization,
    getTeamMembers,
    getTeamSlugById,
} from "~/actions";
import {OrganizationInvitationEmail} from "~/components/emails";
import {db} from "~/db";
import * as schema from "~/db/schema";
import {ALLOWED_EMAIL_DOMAIN} from "~/lib/constants";
import env from "~/lib/env";
import {addSeedData} from "~/lib/seed";
import {admin, member, owner} from "./permissions";

const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST as any,
    port: env.SMTP_PORT,
    secure: false, // true for 465
    auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASSWORD,
    },
} as any);
const EMAIL_INVITATION_SUBJECT =
    "You're invited to join the SuperPlay Localization Platform";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "mysql",
        usePlural: true,
        schema,
    }),
    session: {
        cookieCache: {
            enabled: true,
            maxAge: 5 * 60,
            strategy: "jwt",
        },
    },
    advanced: {
        database: {
            generateId: (_options) => {
                return uuidv7();
            },
        },
    },
    socialProviders: {
        google: {
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
        },
    },
    databaseHooks: {
        session: {
            create: {
                before: async (session) => {
                    const [activeOrganization, err] = await getActiveOrganization(
                        session.userId,
                    );
                    if (err || !activeOrganization) {
                        console.error("Error fetching active organization:", err);
                        return {
                            data: session,
                        };
                    }

                    const [teams, teamsErr] = await getTeamMembers(session.userId);
                    if (teamsErr || !teams) {
                        console.error("Error fetching team memberships:", teamsErr);
                        return {
                            data: session,
                            activeOrganizationId: activeOrganization.id,
                        };
                    }
                    const activeTeam = teams
                        .sort(
                            (a, b) =>
                                new Date(b.createdAt!).getTime() -
                                new Date(a.createdAt!).getTime(),
                        )
                        .find((team) => team.organizationId === activeOrganization.id);

                    if (!activeTeam) {
                        console.warn(
                            "No active team found for user in active organization",
                        );
                        return {
                            data: session,
                            activeOrganizationId: activeOrganization.id,
                        };
                    }

                    return {
                        data: {
                            ...session,
                            activeOrganizationId: activeOrganization.id,
                            activeTeamId: activeTeam.id,
                        },
                    };
                },
            },
        },
        user: {
            create: {
                after: async (user, _context) => {
                    const {data: orgCount, error} = await countOrganization();
                    if (error || typeof orgCount === "undefined") {
                        console.error("Error counting users:", error);
                        throw new APIError("INTERNAL_SERVER_ERROR", {
                            message: "Failed to count users.",
                        });
                    }
                    if (orgCount === 0) {
                        await addSeedData();
                    }
                    const {data: usersCount, error: err} = await countUsers();
                    if (err || typeof usersCount === "undefined") {
                        console.error("Error counting users:", err);
                        throw new APIError("INTERNAL_SERVER_ERROR", {
                            message: "Failed to count users.",
                        });
                    }
                    if (usersCount! <= 1) {
                        await Promise.all([
                            addMemberToOrganization(user.id, "owner"),
                            addMemberToTeam(user.id, "admin"),
                        ]);
                        revalidateTag("organizations", "max");
                    }
                },
            },
        },
    },
    schema: {
        session: {
            additionalFields: {
                activeTeamId: {
                    type: "string",
                    required: false,
                    input: false,
                },
            },
        },
    },
    plugins: [
        organization({
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
                }
            },
            teams: {
                enabled: true,
            },
            sendInvitationEmail: async ({id, email}) => {
                const name = email.split(".")[0] || email;
                const html = await render(
                    OrganizationInvitationEmail({name, invitationId: id}),
                );
                await transporter.sendMail({
                    from: env.SMTP_FROM,
                    to: email,
                    subject: EMAIL_INVITATION_SUBJECT,
                    html,
                });
            },
            roles: {
                owner,
                admin,
                member,
            },
        }),
        adminPlugin(),
        nextCookies(),
    ],
    hooks: {
        after: createAuthMiddleware(async (ctx) => {
            if (!ctx.path?.startsWith("/callback/")) return;
            const newSession = ctx.context.newSession;
            if (!newSession?.user?.email) return;
            const email = newSession.user.email.toLowerCase();
            if (!email.endsWith(ALLOWED_EMAIL_DOMAIN)) {
                await ctx.context.internalAdapter.deleteSession(
                    newSession.session.token,
                );
                const cookieName = ctx.context.authCookies.sessionToken.name;
                const attrs = ctx.context.authCookies.sessionToken.attributes ?? {};
                ctx.setCookie(cookieName, "", {...attrs, maxAge: 0});
                throw ctx.redirect("/sign-in?error=unauthorized_domain");
            }

            if (newSession?.session?.activeTeamId) {
                const {data: teamSlug, error} = await getTeamSlugById(
                    newSession.session.activeTeamId,
                );
                if (error || !teamSlug) {
                    console.error("Error fetching team slug:", error);
                    throw new APIError("INTERNAL_SERVER_ERROR", {
                        message: "Failed to fetch team slug.",
                    });
                }

                ctx.redirect(`/${teamSlug}`);
            }
        }),
    },
});
