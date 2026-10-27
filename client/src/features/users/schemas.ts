import { z } from "zod";
import { UserRole } from "@/enums";

export const profileInfoSchema = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
});
export type ProfileInfoFormValues = z.infer<typeof profileInfoSchema>;

export const deleteAccountSchema = z.object({
  password: z.string().trim().min(1),
});
export type DeleteAccountFormValues = z.infer<typeof deleteAccountSchema>;

export const inviteUserSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, { message: "settings.toast.required_fields" }),
  role: z.enum([UserRole.Admin, UserRole.Developer]),
});
export type InviteUserFormValues = z.infer<typeof inviteUserSchema>;
