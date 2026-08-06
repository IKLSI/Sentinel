import { createFileRoute } from "@tanstack/react-router";
import { AcceptInvitationPage } from "@/features/auth/pages/AcceptInvitationPage";

type AcceptInvitationSearch = { token?: string };

export const Route = createFileRoute("/accept-invitation")({
  validateSearch: (
    search: Record<string, unknown>,
  ): AcceptInvitationSearch => ({
    token: typeof search.token === "string" ? search.token : undefined,
  }),
  component: AcceptInvitationPage,
});
