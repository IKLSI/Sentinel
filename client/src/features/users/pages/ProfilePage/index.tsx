import type React from "react";
import { useState } from "react";
import Box from "@mui/material/Box";
import { PageContainer } from "@/components/layout/PageContainer";
import { SCROLL_AREA_SX } from "@/features/users/pages/ProfilePage/constants";
import { InfoCard } from "@/features/users/pages/ProfilePage/components/InfoCard";
import { PreferencesCard } from "@/features/users/pages/ProfilePage/components/PreferencesCard";
import { GdprCard } from "@/features/users/pages/ProfilePage/components/GdprCard";
import { DeleteAccountModal } from "@/features/users/pages/ProfilePage/components/DeleteAccountModal";
import { VersionBadge } from "@/features/users/pages/ProfilePage/components/VersionBadge";
import { LegalLinks } from "@/features/legal/components/LegalLinks";

export const ProfilePage: React.FC = () => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  return (
    <PageContainer sx={{ p: "20px 24px" }}>
      <Box sx={SCROLL_AREA_SX}>
        <InfoCard />
        <PreferencesCard />
        <GdprCard onDeleteRequest={() => setDeleteDialogOpen(true)} />
        <LegalLinks tone="app" sx={{ mt: "auto", pt: "8px", pb: "4px" }} />
      </Box>

      <DeleteAccountModal
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      />

      <VersionBadge />
    </PageContainer>
  );
};
