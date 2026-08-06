import { createFileRoute } from "@tanstack/react-router";
import { ResetPasswordPage } from "@/features/auth/pages/ResetPasswordPage";

type ResetPasswordSearch = { token?: string };

export const Route = createFileRoute("/reset-password")({
  validateSearch: (search: Record<string, unknown>): ResetPasswordSearch => ({
    token: typeof search.token === "string" ? search.token : undefined,
  }),
  component: ResetPasswordPage,
});
