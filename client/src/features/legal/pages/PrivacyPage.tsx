import type React from "react";
import { ROUTES } from "@/constants/routes";
import { LegalDocument } from "@/features/legal/components/LegalDocument";
import type { LegalSection } from "@/features/legal/types";

const SECTIONS: LegalSection[] = [
  {
    id: "roles",
  },
  {
    id: "purposes",
    bulletKeys: [
      "privacy.purposes.item.service",
      "privacy.purposes.item.account",
      "privacy.purposes.item.security",
      "privacy.purposes.item.no_profiling",
    ],
  },
  {
    id: "recipients",
    bulletKeys: [
      "privacy.recipients.item.hosting",
      "privacy.recipients.item.email",
      "privacy.recipients.item.repos",
      "privacy.recipients.item.transfers",
    ],
  },
  {
    id: "retention",
    entryKeys: [
      "privacy.retention.account",
      "privacy.retention.activity",
      "privacy.retention.audit",
      "privacy.retention.tokens",
    ],
  },
  {
    id: "rights",
    bulletKeys: [
      "privacy.rights.item.self_service",
      "privacy.rights.item.request",
      "privacy.rights.item.complaint",
    ],
    linkKey: "privacy.rights.profile_link",
    linkTo: ROUTES.PROFILE,
  },
  {
    id: "contact",
  },
];

export const PrivacyPage: React.FC = () => (
  <LegalDocument documentId="privacy" prefix="privacy" sections={SECTIONS} />
);
