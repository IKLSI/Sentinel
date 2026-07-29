import { z } from "zod";

export const createTicketSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string(),
  priority: z.enum(["Critical", "High", "Medium", "Low"]),
  type: z.enum([
    "Bug",
    "Feature",
    "Security",
    "Performance",
    "Maintenance",
    "Question",
  ]),
  projectId: z.string().optional(),
  assignedToId: z.string().optional(),
  estimatedMinutes: z.number(),
});
export type CreateTicketFormValues = z.infer<typeof createTicketSchema>;

export const editTicketSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string(),
  priority: z.string(),
  type: z.string(),
  status: z.string(),
  projectId: z.string(),
  assignedToId: z.string(),
  estimatedMinutes: z.number(),
});
export type EditTicketFormValues = z.infer<typeof editTicketSchema>;
