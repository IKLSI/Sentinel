import React from "react";
import Box from "@mui/material/Box";
import LinkRounded from "@mui/icons-material/LinkRounded";
import { DetailPalette } from "../../helpers";

interface Props {
  palette: DetailPalette;
  endpointMatch: string | null;
  titleBeforeEndpoint: string;
}

export const TicketHeader: React.FC<Props> = ({
  palette,
  endpointMatch,
  titleBeforeEndpoint,
}) => {
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
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        {titleBeforeEndpoint}
        {endpointMatch && (
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontFamily: "var(--font-mono)",
              fontSize: { xs: "15px", md: "20px" },
              color: palette.endpointFg,
              background: palette.endpointBg,
              border: `1px solid ${palette.endpointBorder}`,
              borderRadius: 'var(--r-md)',
              px: "11px",
              py: "5px",
              fontWeight: 600,
            }}
          >
            <LinkRounded sx={{ fontSize: 16, color: palette.endpointIcon }} />
            {endpointMatch}
          </Box>
        )}
      </Box>
    </Box>
  );
};
