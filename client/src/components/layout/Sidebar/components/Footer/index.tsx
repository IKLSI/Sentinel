import type React from "react";
import Box from "@mui/material/Box";
import { LogoutButton } from "@/components/layout/Sidebar/components/LogoutButton";
import { ProfileButton } from "@/components/layout/Sidebar/components/ProfileButton";

interface Props {
  collapsed: boolean;
}

export const Footer: React.FC<Props> = ({ collapsed }) => (
  <Box
    sx={{
      flexShrink: 0,
      borderTop: "1px solid var(--border)",
      px: collapsed ? "0" : "10px",
      py: "10px",
      display: "flex",
      flexDirection: collapsed ? "column" : "row",
      alignItems: "center",
      justifyContent: collapsed ? "center" : "flex-start",
      gap: collapsed ? "4px" : "8px",
    }}
  >
    <ProfileButton collapsed={collapsed} />

    <Box
      sx={{
        display: "flex",
        flexDirection: collapsed ? "column" : "row",
        alignItems: "center",
        gap: "2px",
        flexShrink: 0,
      }}
    >
      <LogoutButton />
    </Box>
  </Box>
);
