import type React from "react";
import Box from "@mui/material/Box";
import { CopyToken } from "@/features/styleGuide/pages/StyleGuidePage/components/CopyToken";

interface Props {
  token: string;
  name: string;
  usage: string;
}

export const FontFamilyCard: React.FC<Props> = ({ token, name, usage }) => (
  <Box
    sx={{
      minWidth: 0,
      display: "flex",
      gap: "16px",
      p: "16px",
      background: "var(--s1)",
      border: "1px solid var(--border)",
      borderRadius: "var(--r-lg)",
    }}
  >
    <Box
      aria-hidden
      sx={{
        width: 56,
        height: 56,
        flexShrink: 0,
        display: "grid",
        placeItems: "center",
        borderRadius: "var(--r-md)",
        background: "var(--s2)",
        fontFamily: `var(--${token})`,
        fontSize: "24px",
        fontWeight: 600,
        letterSpacing: "-0.02em",
        color: "var(--text)",
      }}
    >
      Aa
    </Box>
    <Box
      sx={{
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: "4px",
      }}
    >
      <Box
        sx={{
          fontFamily: `var(--${token})`,
          fontSize: "15px",
          fontWeight: 600,
          color: "var(--text)",
        }}
      >
        {name}
      </Box>
      <CopyToken token={token} />
      <Box
        sx={{
          mt: "4px",
          fontSize: "12px",
          lineHeight: 1.5,
          color: "var(--muted2)",
        }}
      >
        {usage}
      </Box>
    </Box>
  </Box>
);
