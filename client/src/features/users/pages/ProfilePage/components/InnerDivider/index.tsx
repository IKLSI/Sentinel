import type React from "react";
import Box from "@mui/material/Box";

interface Props {
  label: string;
}

export const InnerDivider: React.FC<Props> = ({ label }) => {
  return (
    <Box
      sx={{
        px: "16px",
        minHeight: "38px",
        display: "flex",
        alignItems: "center",
        borderBottom: "1px solid var(--border)",
        background: "var(--s2)",
      }}
    >
      <Box
        sx={{
          fontSize: "11px",
          fontWeight: 700,
          color: "var(--muted)",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </Box>
    </Box>
  );
};
