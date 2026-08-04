import type React from "react";
import { useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { MembersTab } from "@/features/settings/pages/SettingsPage/components/MembersTab";
import { InviteModal } from "@/features/settings/pages/SettingsPage/components/InviteModal";

export const UsersPage: React.FC = () => {
  const [inviteOpen, setInviteOpen] = useState(false);

  return (
    <>
      <PageContainer>
        <MembersTab onInviteClick={() => setInviteOpen(true)} />
      </PageContainer>
      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </>
  );
};
