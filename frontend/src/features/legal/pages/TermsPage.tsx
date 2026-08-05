import type React from "react";
import { ROUTES } from "@/constants/routes";
import { LegalDocument } from "@/features/legal/components/LegalDocument";
import type { LegalSection } from "@/features/legal/types";

const SECTIONS: LegalSection[] = [
  {
    id: "object",
    titleKey: "terms.object.title",
    bodyKey: "terms.object.body",
  },
  {
    id: "service",
    titleKey: "terms.service.title",
    bodyKey: "terms.service.body",
    bulletKeys: [
      "terms.service.item.scan",
      "terms.service.item.score",
      "terms.service.item.tickets",
      "terms.service.item.evolution",
    ],
  },
  {
    id: "account",
    titleKey: "terms.account.title",
    bodyKey: "terms.account.body",
    bulletKeys: [
      "terms.account.item.accuracy",
      "terms.account.item.roles",
      "terms.account.item.security",
      "terms.account.item.age",
    ],
  },
  {
    id: "plans",
    titleKey: "terms.plans.title",
    bodyKey: "terms.plans.body",
    bulletKeys: [
      "terms.plans.item.currency",
      "terms.plans.item.quota",
      "terms.plans.item.change",
      "terms.plans.item.price_change",
    ],
  },
  {
    id: "billing",
    titleKey: "terms.billing.title",
    bodyKey: "terms.billing.body",
    bulletKeys: [
      "terms.billing.item.cycle",
      "terms.billing.item.invoice",
      "terms.billing.item.failure",
      "terms.billing.item.no_refund",
    ],
  },
  {
    id: "duration",
    titleKey: "terms.duration.title",
    bodyKey: "terms.duration.body",
    bulletKeys: [
      "terms.duration.item.client",
      "terms.duration.item.effect",
      "terms.duration.item.breach",
    ],
  },
  {
    id: "withdrawal",
    titleKey: "terms.withdrawal.title",
    bodyKey: "terms.withdrawal.body",
  },
  {
    id: "obligations",
    titleKey: "terms.obligations.title",
    bodyKey: "terms.obligations.body",
    bulletKeys: [
      "terms.obligations.item.rights",
      "terms.obligations.item.tokens",
      "terms.obligations.item.security",
      "terms.obligations.item.content",
      "terms.obligations.item.resale",
    ],
  },
  {
    id: "intellectual-property",
    titleKey: "terms.ip.title",
    bodyKey: "terms.ip.body",
  },
  {
    id: "availability",
    titleKey: "terms.availability.title",
    bodyKey: "terms.availability.body",
  },
  {
    id: "liability",
    titleKey: "terms.liability.title",
    bodyKey: "terms.liability.body",
    bulletKeys: [
      "terms.liability.item.cap",
      "terms.liability.item.indirect",
      "terms.liability.item.force",
    ],
  },
  {
    id: "personal-data",
    titleKey: "legal_notice.personal_data.title",
    bodyKey: "legal_notice.personal_data.body",
    linkKey: "legal_notice.personal_data.link",
    linkTo: ROUTES.PRIVACY,
  },
  {
    id: "changes",
    titleKey: "terms.changes.title",
    bodyKey: "terms.changes.body",
  },
  {
    id: "law",
    titleKey: "terms.law.title",
    bodyKey: "terms.law.body",
  },
];

export const TermsPage: React.FC = () => (
  <LegalDocument
    documentId="terms"
    titleKey="terms.title"
    subtitleKey="terms.subtitle"
    updatedKey="terms.updated"
    sections={SECTIONS}
  />
);
