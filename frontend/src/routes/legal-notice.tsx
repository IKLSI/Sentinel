import { createFileRoute } from "@tanstack/react-router";
import { LegalNoticePage } from "@/features/legal/pages/LegalNoticePage";

export const Route = createFileRoute("/legal-notice")({
  component: LegalNoticePage,
});
