import { createFileRoute } from "@tanstack/react-router";
import { PrivacyPage } from "@/features/legal/pages/PrivacyPage";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
});
