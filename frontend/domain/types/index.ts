import { type LucideIcon } from "lucide-react";
import { z } from "zod";
import { authClient } from "~/lib/auth/client";
import { auditLogs, events, invitations, organizations, rules, teamMembers, teams, users } from "~/lib/db/schema";
import { setActiveOrganization } from "~/lib/actions";
import { SortingState } from "@tanstack/react-table";


/**
 * A type representing a constructor function.
 */
type BaseConstructor = { new(...args: any[]): any };

/**
 * A type representing a constructor function for a specific type.
 * @template T - The type of the instance created by the constructor.
 */
export type Constructor<T extends BaseConstructor> = new (...args: any[]) => T;

/**
 * A type representing primitive values.
 */
export type Primitive = string | number | bigint | boolean | Date | null;

/**
 * A type representing a string that contains a numeric value.
 */
export type NumericString = `${number}`;

/**
 * A type representing a JSON object.
 */
export type JSONObject = { [key: string]: JSONValue };

/**
 * A type representing a JSON array.
 */
export type JSONArray = JSONValue[];

/**
 * A type representing a JSON value, which can be a primitive, a JSON object, or a JSON array.
 */
export type JSONValue = Primitive | JSONObject | JSONArray;

/**
 * A type representing an optional value.
 * @template T - The type of the value.
 */
export type Optional<T> = T | null | undefined;

/**
 * A type that simplifies a given type by removing any additional properties.
 * @template T - The type to simplify.
 */
export type Simplify<T> = { [P in keyof T]: T[P] } & {};

/**
 * A type representing a numeric identifier.
 */
export type NumericID = number | bigint | NumericString;

/**
 * A type representing a MongoDB document identifier.
 */

/**
 * A type representing a function that returns either void or a Promise that resolves to void.
 */
export type VoidOrPromiseVoid = void | Promise<void>;


export type Rule = {
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
export type EventWithRules = Simplify<SelectEvent & { rules: SelectRule[] }>;
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
export type AuditLogSelect = typeof auditLogs.$inferSelect;
export type AuditLogsInsert = typeof auditLogs.$inferInsert;
export type UserInsert = typeof users.$inferInsert;
export type FullOrg = Awaited<ReturnType<typeof setActiveOrganization>>;

export type SideBarItem = SelectEvent & {
    url: string;
    icon?: LucideIcon | null | undefined;
};

export type PaginationAndSorting = {
    pageIndex: number;
    pageSize: number;
    sorting: SortingState;
    q: string;

}