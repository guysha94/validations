// import "server-only";

import {and, count, eq} from "drizzle-orm";
import {betterAuth} from "better-auth";
import {admin as adminPlugin, organization} from "better-auth/plugins";
import {env} from "~/env/server";
import {drizzleAdapter} from "better-auth/adapters/drizzle";
import {validationsDb} from "~/lib/db";
import {events, invitations, members, organizations, rules, teamMembers, teams, users,} from "~/lib/db/schema";
import { uuidv7 } from "uuidv7";
import {nextCookies} from "better-auth/next-js";
import nodemailer from "nodemailer";
import {render} from "@react-email/render";
import EmailTemplate from "~/components/EmailTemplate";
import {ALLOWED_ROLES} from "~/lib/constants";
import {ac, admin, member, owner, viewer} from "./permissions"


const SUPERPLAY_ORG_SLUG = "superplay";
const EMAIL_INVITATION_SUBJECT = "You're invited to join the SuperPlay Validation Platform";


const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST as any,
    port: env.SMTP_PORT,
    secure: false, // true for 465
    auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASSWORD,
    },
} as any);

async function setupFirstUserAsAdmin(userId: string): Promise<void> {
    const [countResult] = await validationsDb
        .select({n: count()})
        .from(users);
    if (countResult?.n !== 1) return;

    await validationsDb
        .update(users)
        .set({role: "owner"})
        .where(eq(users.id, userId));

    const [org] = await validationsDb
        .select()
        .from(organizations)
        .where(eq(organizations.slug, SUPERPLAY_ORG_SLUG))
        .limit(1);
    if (!org) return;

    const [existingMember] = await validationsDb
        .select()
        .from(members)
        .where(
            and(
                eq(members.userId, userId),
                eq(members.organizationId, org.id)
            )
        )
        .limit(1);
    if (!existingMember) {
        await validationsDb.insert(members).values({
            id: uuidv7(),
            organizationId: org.id,
            userId,
            role: "owner",
            createdAt: new Date(),
        });
    }

    const orgTeams = await validationsDb
        .select()
        .from(teams)
        .where(eq(teams.organizationId, org.id));
    const now = new Date();
    for (const team of orgTeams) {
        const [existing] = await validationsDb
            .select()
            .from(teamMembers)
            .where(
                and(
                    eq(teamMembers.teamId, team.id),
                    eq(teamMembers.userId, userId)
                )
            )
            .limit(1);
        if (!existing) {
            await validationsDb.insert(teamMembers).values({
                id: uuidv7(),
                teamId: team.id,
                userId,
                role: "owner",
                createdAt: now,
            });
        }
    }
}

export const auth = betterAuth({
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    database: drizzleAdapter(validationsDb, {
        provider: "mysql",
        usePlural: true,
    }),
    socialProviders: {
        google: {
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
        },
    },
    plugins: [
        organization({
            ac,
            disableOrganizationDeletion: true,
            cancelPendingInvitationsOnReInvite: true,
            allowUserToCreateOrganization: false,
            async sendInvitationEmail({id, role, email, organization, invitation, inviter}) {

                const name = email.split(".")[0] || email;
                const html = await render(EmailTemplate({name, invitationId: id}));
                await transporter.sendMail({
                    from: env.SMTP_FROM,
                    to: email,
                    subject: EMAIL_INVITATION_SUBJECT,
                    html,
                });
            },

            organizationHooks: {
                afterAcceptInvitation: async ({invitation, member, user}) => {
                    // Sync users.role from invitation role; admin plugin defaults to "user"
                    // which is not in our org roles (owner, admin, member).
                    const raw = invitation.role ?? "member";
                    const role = typeof raw === "string" ? raw.split(",")[0]?.trim() ?? "member" : "member";
                    const resolvedRole = ALLOWED_ROLES.includes(role) ? role : "member";

                    await validationsDb
                        .update(users)
                        .set({role: resolvedRole})
                        .where(eq(users.id, user.id));

                    // Add user to team(s) from invitation; better-auth may miss this if
                    // updateInvitation returns partial data. Fetch full invitation to get teamId.
                    const [inv] = await validationsDb
                        .select({teamId: invitations.teamId})
                        .from(invitations)
                        .where(eq(invitations.id, invitation.id))
                        .limit(1);
                    if (inv?.teamId?.trim()) {
                        const teamIds = inv.teamId.split(",").map((t) => t.trim()).filter(Boolean);
                        const now = new Date();
                        for (const teamId of teamIds) {
                            const [existing] = await validationsDb
                                .select()
                                .from(teamMembers)
                                .where(
                                    and(
                                        eq(teamMembers.teamId, teamId),
                                        eq(teamMembers.userId, user.id)
                                    )
                                )
                                .limit(1);
                            if (!existing) {
                                await validationsDb.insert(teamMembers).values({
                                    id: uuidv7(),
                                    teamId,
                                    userId: user.id,
                                    role: resolvedRole,
                                    createdAt: now,
                                });
                            }
                        }
                    }
                },
            },
            teams: {enabled: true},
            roles: {
                owner,
                admin,
                member,
                viewer
            },
            schema: {
                team: {
                    additionalFields: {
                        slug: {
                            type: "string",
                            unique: true,
                            required: false,
                            input: false
                        }
                    }
                }
            }
        }),
        adminPlugin(),
        nextCookies(),
    ],
    // hooks: {
    //     after: createAuthMiddleware(async (ctx) => {
    //         if (!ctx.path?.startsWith("/callback/")) return;
    //         const newSession = ctx.context.newSession as
    //             | {
    //             session: { token: string };
    //             user: { id?: string; email?: string | null };
    //         }
    //             | undefined;
    //         if (!newSession?.user?.email) return;
    //         // const email = newSession.user.email.toLowerCase();
    //         // if (!email.endsWith(ALLOWED_EMAIL_DOMAIN)) {
    //         //     await ctx.context.internalAdapter.deleteSession(
    //         //         newSession.session.token
    //         //     );
    //         //     const cookieName =
    //         //         ctx.context.authCookies.sessionToken.name;
    //         //     const attrs =
    //         //         ctx.context.authCookies.sessionToken.attributes ?? {};
    //         //     ctx.setCookie(cookieName, "", {...attrs, maxAge: 0});
    //         //     throw ctx.redirect(
    //         //         "/sign-in?error=unauthorized_domain"
    //         //     );
    //         // }
    //
    //         const userId = newSession.user.id;
    //         if (userId) {
    //             try {
    //                 await setupFirstUserAsAdmin(userId);
    //
    //                 const [userTeams, error] = await fetchUserTeams(userId);
    //                 if (error) {
    //                     console.error("Error fetching user teams during session setup:", error);
    //                 } else if (userTeams.length > 0) {
    //                     const activeTeamId = userTeams[0].id;
    //                     await ctx.context.internalAdapter.updateSession(newSession.session.token, {
    //                         activeTeamId,
    //                     });
    //                 }
    //
    //             } catch (e) {
    //                 console.error("First-user admin setup failed:", e);
    //             }
    //         }
    //     }),
    // },
});


type Session = typeof auth.$Infer.Session;
export type ServerAuthUser = Session["user"];
export type ServerAuthSession = Session["session"];
export type ServerSession = { session: ServerAuthSession, user: ServerAuthUser };


export type SelectEvent = typeof events.$inferSelect;
export type InsertEvent = typeof events.$inferInsert;
export type SelectRule = typeof rules.$inferSelect;
export type InsertRule = typeof rules.$inferInsert;
