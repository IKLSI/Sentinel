import { z } from "zod";

export function passwordComplexitySchema(messageKey: string) {
  return z
    .string()
    .min(12, { message: messageKey })
    .regex(/[a-z]/, { message: messageKey })
    .regex(/[A-Z]/, { message: messageKey })
    .regex(/\d/, { message: messageKey })
    .regex(/[^A-Za-z0-9]/, { message: messageKey });
}

export function withPasswordConfirmRefine<
  T extends z.ZodType<{ password: string; confirm: string }>,
>(schema: T, mismatchKey: string) {
  return schema.superRefine((data, ctx) => {
    if (data.password !== data.confirm) {
      ctx.addIssue({
        code: "custom",
        message: mismatchKey,
        path: ["confirm"],
      });
    }
  });
}
