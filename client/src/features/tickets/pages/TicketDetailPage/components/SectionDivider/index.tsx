import type React from "react";
import Box from "@mui/material/Box";
import { DETAIL_PALETTE } from "@/features/tickets/pages/TicketDetailPage/helpers";

interface Props {
  icon: React.ReactNode;
  label: string;
  my?: string;
}

export const SectionDivider: React.FC<Props> = ({ icon, label, my }) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      gap: "14px",
      mb: my ? 0 : "22px",
      my,
    }}
  >
    <Box
      sx={{ flex: 1, height: "1px", background: DETAIL_PALETTE.sectionDivider }}
    />
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        fontSize: "11px",
        fontWeight: 600,
        color: DETAIL_PALETTE.sectionLabel,
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        whiteSpace: "nowrap",
      }}
    >
      {icon}
      {label}
    </Box>
    <Box
      sx={{ flex: 1, height: "1px", background: DETAIL_PALETTE.sectionDivider }}
    />
  </Box>
);
