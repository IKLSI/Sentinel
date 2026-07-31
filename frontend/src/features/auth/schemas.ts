import { z } from "zod";
import { passwordComplexitySchema } from "@/helpers/validation/password";

export const loginSchema = z.object({
  email: z.string().trim().min(1, { message: "auth.login.fill_all_fields" }),
  password: z.string().min(1, { message: "auth.login.fill_all_fields" }),
});
export type LoginFormValues = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  organizationName: z
    .string()
    .trim()
    .min(1, { message: "auth.register.fill_all_fields" }),
  firstName: z
    .string()
    .trim()
    .min(1, { message: "auth.register.fill_all_fields" }),
  lastName: z
    .string()
    .trim()
    .min(1, { message: "auth.register.fill_all_fields" }),
  email: z.string().trim().min(1, { message: "auth.register.fill_all_fields" }),
  password: z.string().min(1, { message: "auth.register.fill_all_fields" }),
});
export type RegisterFormValues = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, { message: "auth.forgot_password.error_email_required" }),
});
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: passwordComplexitySchema(
      "auth.reset_password.error_password_min_length",
    ),
    confirm: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirm) {
      ctx.addIssue({
        code: "custom",
        message: "auth.reset_password.error_passwords_mismatch",
        path: ["confirm"],
      });
    }
  });
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export const acceptInvitationSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(1, { message: "auth.accept_invitation.error_firstname_required" }),
    lastName: z.string().optional(),
    password: passwordComplexitySchema(
      "auth.accept_invitation.error_password_min_length",
    ),
    confirm: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirm) {
      ctx.addIssue({
        code: "custom",
        message: "auth.accept_invitation.error_passwords_mismatch",
        path: ["confirm"],
      });
    }
  });
export type AcceptInvitationFormValues = z.infer<typeof acceptInvitationSchema>;
