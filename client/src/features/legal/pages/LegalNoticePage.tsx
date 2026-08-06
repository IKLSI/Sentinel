import type React from "react";
import { ROUTES } from "@/constants/routes";
import { LegalDocument } from "@/features/legal/components/LegalDocument";
import type { LegalSection } from "@/features/legal/types";

const SECTIONS: LegalSection[] = [
  {
    id: "publisher",
    titleKey: "legal_notice.publisher.title",
    bodyKey: "legal_notice.publisher.body",
    entryKeys: [
      "legal_notice.publisher.company",
      "legal_notice.publisher.form",
      "legal_notice.publisher.capital",
      "legal_notice.publisher.registration",
      "legal_notice.publisher.siret",
      "legal_notice.publisher.vat",
      "legal_notice.publisher.address",
      "legal_notice.publisher.phone",
      "legal_notice.publisher.director",
    ],
  },
  {
    id: "hosting",
    titleKey: "legal_notice.hosting.title",
    bodyKey: "legal_notice.hosting.body",
    entryKeys: [
      "legal_notice.hosting.provider",
      "legal_notice.hosting.address",
      "legal_notice.hosting.infrastructure",
      "legal_notice.hosting.region",
    ],
  },
  {
    id: "intellectual-property",
    titleKey: "legal_notice.ip.title",
    bodyKey: "legal_notice.ip.body",
  },
  {
    id: "sources",
    titleKey: "legal_notice.sources.title",
    bodyKey: "legal_notice.sources.body",
  },
  {
    id: "liability",
    titleKey: "legal_notice.liability.title",
    bodyKey: "legal_notice.liability.body",
  },
  {
    id: "personal-data",
    titleKey: "legal_notice.personal_data.title",
    bodyKey: "legal_notice.personal_data.body",
    linkKey: "legal_notice.personal_data.link",
    linkTo: ROUTES.PRIVACY,
  },
  {
    id: "law",
    titleKey: "legal_notice.law.title",
    bodyKey: "legal_notice.law.body",
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
