import * as z from "zod";

export const eventRuleSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  errorMessage: z.string().min(1, "Error message is required"),
  query: z.string(),
  enabled: z.boolean(),
});

export type EventRuleFormData = z.infer<typeof eventRuleSchema>;

export const formSchema = z.object({
  rules: z.array(eventRuleSchema),
});

export type FormData = z.infer<typeof formSchema>;
