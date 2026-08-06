import { createFileRoute, notFound } from "@tanstack/react-router";
import { StyleGuidePage } from "@/features/styleGuide/pages/StyleGuidePage";

export const Route = createFileRoute("/style-guide")({
  beforeLoad: () => {
    if (!import.meta.env.DEV) throw notFound();
  },
  component: StyleGuidePage,
});
