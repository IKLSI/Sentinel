import type React from "react";
import Box from "@mui/material/Box";
import Avatar from "@mui/material/Avatar";
import { Section } from "@/features/styleGuide/pages/StyleGuidePage/components/Section";

export const AvatarsSection: React.FC = () => {
  return (
    <Section title="Avatars">
      <Box sx={{ display: "flex", alignItems: "center", gap: "14px" }}>
        <Avatar
          sx={{
            width: 24,
            height: 24,
            bgcolor: "var(--s3)",
            color: "var(--muted)",
            fontSize: "9px",
          }}
        >
          JD
        </Avatar>
        <Avatar
          sx={{
            width: 32,
            height: 32,
            bgcolor: "var(--s3)",
            color: "var(--muted)",
            fontSize: "11px",
          }}
        >
          JD
        </Avatar>
        <Avatar
          sx={{
            width: 40,
            height: 40,
            bgcolor: "var(--s3)",
            color: "var(--muted)",
            fontSize: "13px",
          }}
        >
          JD
        </Avatar>
        <Avatar
          sx={{
            width: 56,
            height: 56,
            bgcolor: "var(--accent-subtle)",
            color: "var(--accent)",
            fontSize: "17px",
            fontWeight: 700,
          }}
        >
          JD
        </Avatar>
      </Box>
    </Section>
  );
};
