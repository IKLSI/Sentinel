import { createFileRoute } from "@tanstack/react-router";
import { ScanPage } from "@/features/publicScan/pages/ScanPage";

type ScanSearch = { repo?: string };

export const Route = createFileRoute("/scan")({
  validateSearch: (search: Record<string, unknown>): ScanSearch => ({
    repo: typeof search.repo === "string" ? search.repo : undefined,
  }),
  component: ScanPage,
});
