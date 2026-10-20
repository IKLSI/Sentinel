import type React from "react";
import Box from "@mui/material/Box";
import type { DetailPalette } from "@/features/tickets/pages/TicketDetailPage/helpers";

interface Props {
  palette: DetailPalette;
  title: string;
}

export const TicketHeader: React.FC<Props> = ({ palette, title }) => {
  return (
    <Box
      sx={{
        px: { xs: "24px", md: "40px" },
        pt: { xs: "24px", md: "36px" },
        pb: 0,
      }}
    >
      <Box
        component="h1"
        sx={{
          m: 0,
          mt: "4px",
          mb: "0px",
          fontSize: { xs: "18px", md: "24px" },
          lineHeight: 1.2,
          letterSpacing: "-0.02em",
          color: palette.title,
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        {title}
      </Box>
    </Box>
  );
};
