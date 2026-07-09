import type React from "react";
import { useState } from "react";
import Box from "@mui/material/Box";
import { MembersTab } from "@/features/settings/pages/SettingsPage/components/MembersTab";
import { InviteModal } from "@/features/settings/pages/SettingsPage/components/InviteModal";

export const UsersPage: React.FC = () => {
  const [inviteOpen, setInviteOpen] = useState(false);

  return (
    <>
      <Box
        className="page-enter"
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          overflow: "hidden",
          p: "20px 28px",
        }}
      >
        <MembersTab onInviteClick={() => setInviteOpen(true)} />
      </Box>
      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </>
  );
};
