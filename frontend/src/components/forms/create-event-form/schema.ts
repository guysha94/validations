import * as z from "zod";

export const schema = z.object({
  type: z.string().min(2, { message: "Event type is required" }),
  title: z.string(),
  icon: z.string(),
  editAccess: z.enum(["public", "restricted"]),
});

export const defaultValues: EventFormValues = {
  type: "",
  title: "",
  icon: "",
  editAccess: "public",
};

export type EventFormValues = z.infer<typeof schema>;
