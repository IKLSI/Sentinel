import { z } from "zod";
import { UserRole } from "@/types/enums";

export const inviteUserSchema = z.object({
  email: z.string().trim().min(1, { message: "settings.toast.required_fields" }),
  role: z.enum([UserRole.Admin, UserRole.Developer]),
});
export type InviteUserFormValues = z.infer<typeof inviteUserSchema>;
