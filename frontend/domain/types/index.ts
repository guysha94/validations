import {type LucideIcon} from "lucide-react";
import {z} from "zod";
import {authClient} from "~/lib/auth/client";
import {users,events, invitations, organizations, rules, teams, teamMembers} from "~/lib/db/schema";
import {setActiveOrganization} from "~/lib/actions";


export type  Rule = {
    name: string;
    error_message: string;
    query: string;
};

export type FormData = {
    rules: Rule[];
};


const SQL_VERBS = [
    "select", "insert", "update", "delete",
    "with", "create", "alter", "drop",
] as const;

function hasBalancedParens(s: string) {
    let depth = 0;
    for (const ch of s) {
        if (ch === "(") depth++;
        else if (ch === ")") depth--;
        if (depth < 0) return false;
    }
    return depth === 0;
}

function countUnescapedSingleQuotes(s: string) {

    let count = 0;
    for (let i = 0; i < s.length; i++) {
        if (s[i] === "'") {
            const prev = s[i - 1];
            const next = s[i + 1];
            if (prev === "\\") continue;
            if (next === "'") {
                i++;
                continue;
            }
            count++;
        }
    }
    return count;
}

export const SqlQuerySchema = z
    .string()
    .trim()
    .min(1, "SQL must not be empty")
    .max(50_000, "SQL is too large")
    .refine((s) => !s.includes("\0"), "SQL contains null byte")
    .refine((s) => /^\s*(--|\/\*)/.test(s) === false, "SQL cannot start with a comment")
    .refine((s) => {
        const firstWord = s.match(/^\s*([a-z]+)/i)?.[1]?.toLowerCase();
        return firstWord ? (SQL_VERBS as readonly string[]).includes(firstWord) : false;
    }, "SQL must start with a supported statement (SELECT/INSERT/UPDATE/DELETE/WITH/CREATE/ALTER/DROP)")
    .refine((s) => hasBalancedParens(s), "Unbalanced parentheses")
    .refine((s) => countUnescapedSingleQuotes(s) % 2 === 0, "Unbalanced single quotes");

export type ValidationErrorInfo = {
    index: number
    tabName: string,
    rowNumber: number,
    errorMessage: string,
}

export type DbTable = {
    name: string;
    columns: string[];
};


type Session = typeof authClient.$Infer.Session;
export type AuthUser = Session["user"];
export type AuthSession = Session["session"];

export type SelectEvent = typeof events.$inferSelect;
export type InsertEvent = typeof events.$inferInsert;
export type SelectRule = typeof rules.$inferSelect;
export type InsertRule = typeof rules.$inferInsert;
export type InsertOrg = typeof organizations.$inferInsert;
export type SelectOrg = typeof organizations.$inferSelect;
export type InsertTeam = typeof teams.$inferInsert;
export type SelectTeam = typeof teams.$inferSelect;
export type SelectInvitation = typeof invitations.$inferSelect;
export type InsertInvitation = typeof invitations.$inferInsert;
export type SelectTeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = typeof teamMembers.$inferInsert;
export type UserSelect = typeof users.$inferSelect;
export type UserInsert = typeof users.$inferInsert;
export type FullOrg = Awaited<ReturnType<typeof setActiveOrganization>>;


export type Optional<T> = T | null | undefined;

export type SideBarItem = SelectEvent & {
    url: string;
    icon?: LucideIcon | null | undefined;
};
