import type { ROUTES } from "@/constants/routes";

type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];

export interface LegalSection {
  id: string;
  titleKey: string;
  bodyKey?: string;
  bulletKeys?: string[];
  entryKeys?: string[];
  linkKey?: string;
  linkTo?: AppRoute;
}
