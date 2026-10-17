import { ROUTES } from "@/constants/routes";

export const LEGAL_DOCUMENTS = [
  { id: "privacy", to: ROUTES.PRIVACY, labelKey: "legal.nav.privacy" },
  {
    id: "legal-notice",
    to: ROUTES.LEGAL_NOTICE,
    labelKey: "legal.nav.legal_notice",
  },
] as const;

export const LEGAL_HEADER_HEIGHT = 56;
export const LEGAL_SCROLL_OFFSET = 76;
