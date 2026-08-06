import type React from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { OrganisationTab } from "@/features/settings/pages/SettingsPage/components/OrganisationTab";

export const OrganisationPage: React.FC = () => (
  <PageContainer>
    <OrganisationTab />
  </PageContainer>
);
