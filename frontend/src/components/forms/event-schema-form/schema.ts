import * as z from "zod";

const formTabsSchema = z.object({
  name: z.string().min(1, "Tab name is required"),
  columns: z.array(z.string()),
});

export const formSchema = z.object({
  tabs: z.array(formTabsSchema).min(1, {
    message: "At least one tab is required",
  }),
});

export type FormData = z.infer<typeof formSchema>;
