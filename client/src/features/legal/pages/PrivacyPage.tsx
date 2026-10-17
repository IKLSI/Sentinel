import type React from "react";
import { ROUTES } from "@/constants/routes";
import { LegalDocument } from "@/features/legal/components/LegalDocument";
import type { LegalSection } from "@/features/legal/types";

const SECTIONS: LegalSection[] = [
  {
    id: "roles",
    titleKey: "privacy.roles.title",
    bodyKey: "privacy.roles.body",
  },
  {
    id: "purposes",
    titleKey: "privacy.purposes.title",
    bodyKey: "privacy.purposes.body",
    bulletKeys: [
      "privacy.purposes.item.service",
      "privacy.purposes.item.account",
      "privacy.purposes.item.security",
      "privacy.purposes.item.no_profiling",
    ],
  },
  {
    id: "recipients",
    titleKey: "privacy.recipients.title",
    bodyKey: "privacy.recipients.body",
    bulletKeys: [
      "privacy.recipients.item.hosting",
      "privacy.recipients.item.email",
      "privacy.recipients.item.repos",
      "privacy.recipients.item.transfers",
    ],
  },
  {
    id: "retention",
    titleKey: "privacy.retention.title",
    bodyKey: "privacy.retention.body",
    entryKeys: [
      "privacy.retention.account",
      "privacy.retention.activity",
      "privacy.retention.audit",
      "privacy.retention.tokens",
    ],
  },
  {
    id: "rights",
    titleKey: "privacy.rights.title",
    bodyKey: "privacy.rights.body",
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
    titleKey: "privacy.contact.title",
    bodyKey: "privacy.contact.body",
  },
];

export const PrivacyPage: React.FC = () => (
  <LegalDocument
    documentId="privacy"
    titleKey="privacy.title"
    subtitleKey="privacy.subtitle"
    updatedKey="privacy.updated"
    sections={SECTIONS}
  />
);
