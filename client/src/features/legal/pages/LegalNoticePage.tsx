import type React from "react";
import { LegalDocument } from "@/features/legal/components/LegalDocument";
import type { LegalSection } from "@/features/legal/types";

const SECTIONS: LegalSection[] = [
  {
    id: "publisher",
  },
  {
    id: "hosting",
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
    prefix="legal_notice"
    sections={SECTIONS}
  />
);
