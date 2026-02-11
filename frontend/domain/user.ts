import {users, rules} from "~/lib/db/schema";
import {createInsertSchema, createSelectSchema, createUpdateSchema} from "drizzle-zod";
import {z} from "zod";



export const userSelectSchema = createSelectSchema(users);
export const userInsertSchema = createInsertSchema(users);
export const userUpdateSchema = createUpdateSchema(users);

export const ruleSelectSchema = createSelectSchema(rules);
export const ruleInsertSchema = createInsertSchema(rules);
export const ruleUpdateSchema = createUpdateSchema(rules);

export type User = z.infer<typeof userSelectSchema>;

export type UserInsert = z.infer<typeof userInsertSchema>;
export type UserUpdate = z.infer<typeof userUpdateSchema>;

export type Rule = z.infer<typeof ruleSelectSchema>;
export type RuleInsert = z.infer<typeof ruleInsertSchema>;
export type RuleUpdate = z.infer<typeof ruleUpdateSchema>;