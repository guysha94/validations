import {type LucideIcon} from "lucide-react";
import {z} from "zod";


export type  Rule = {
    name: string;
    error_message: string;
    query: string;
};

export type FormData = {
    rules: Rule[];
};

export type SideBarItem = {
    id: string;
    title: string;
    type: string;
    url: string;
    icon?: LucideIcon | null | undefined;
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
    tab_name: string,
    row_number: number,
    error_message: string,
}