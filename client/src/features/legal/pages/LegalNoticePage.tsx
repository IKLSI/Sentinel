import type React from "react";
import { LegalDocument } from "@/features/legal/components/LegalDocument";
import type { LegalSection } from "@/features/legal/types";

const SECTIONS: LegalSection[] = [
  {
    id: "publisher",
    titleKey: "legal_notice.publisher.title",
    bodyKey: "legal_notice.publisher.body",
  },
  {
    id: "hosting",
    titleKey: "legal_notice.hosting.title",
    bodyKey: "legal_notice.hosting.body",
    entryKeys: [
      "legal_notice.hosting.provider",
      "legal_notice.hosting.address",
      "legal_notice.hosting.phone",
      "legal_notice.hosting.frontend_provider",
      "legal_notice.hosting.frontend_address",
      "legal_notice.hosting.frontend_contact",
      "legal_notice.hosting.backend_provider",
      "legal_notice.hosting.backend_address",
      "legal_notice.hosting.backend_contact",
    ],
  },
];

export const LegalNoticePage: React.FC = () => (
  <LegalDocument
    documentId="legal-notice"
    titleKey="legal_notice.title"
    subtitleKey="legal_notice.subtitle"
    updatedKey="legal_notice.updated"
    sections={SECTIONS}
  />
);
