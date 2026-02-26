import * as z from "zod";

export const rewardRuleQuerySchema = z.object({
  query: z.string().min(1, "Query is required"),
  errorMessage: z.string().min(1, "Error message is required"),
  description: z.string().optional(),
});

export const rewardRuleSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  enabled: z.boolean(),
  tab: z.string(),
  column: z.string(),
  queries: z.array(rewardRuleQuerySchema),
});

export type RewardRuleFormData = z.infer<typeof rewardRuleSchema>;

export const formSchema = z.object({
  rules: z.array(rewardRuleSchema),
});

export type FormData = z.infer<typeof formSchema>;
