import type React from "react";
import Box from "@mui/material/Box";
import type { DetailPalette } from "../../helpers";

interface Props {
  palette: DetailPalette;
  icon: React.ReactNode;
  label: string;
  my?: string;
}

export const SectionDivider: React.FC<Props> = ({
  palette,
  icon,
  label,
  my,
}) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      gap: "14px",
      mb: my ? 0 : "22px",
      my,
    }}
  >
    <Box sx={{ flex: 1, height: "1px", background: palette.sectionDivider }} />
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        fontSize: "11px",
        fontWeight: 600,
        color: palette.sectionLabel,
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        whiteSpace: "nowrap",
      }}
    >
      {icon}
      {label}
    </Box>
    <Box sx={{ flex: 1, height: "1px", background: palette.sectionDivider }} />
  </Box>
);
