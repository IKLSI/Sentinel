import { z } from "zod";

export const deleteAccountSchema = z.object({
  password: z.string().trim().min(1),
});
export type DeleteAccountFormValues = z.infer<typeof deleteAccountSchema>;
