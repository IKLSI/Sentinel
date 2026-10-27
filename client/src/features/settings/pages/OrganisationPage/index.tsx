import type React from "react";
import Box from "@mui/material/Box";
import { PageContainer } from "@/components/layout/PageContainer";
import { IntegrationsCard } from "@/features/settings/pages/OrganisationPage/components/IntegrationsCard";
import { OrganizationIdentityCard } from "@/features/settings/pages/OrganisationPage/components/OrganizationIdentityCard";

export const OrganisationPage: React.FC = () => (
  <PageContainer>
    <Box sx={{ overflow: "auto", flex: 1, pr: "4px" }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          pb: "8px",
        }}
      >
        <OrganizationIdentityCard />
        <IntegrationsCard />
      </Box>
    </Box>
  </PageContainer>
);
