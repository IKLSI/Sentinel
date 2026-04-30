import React from "react";
import Box from "@mui/material/Box";

export const SkeletonCard: React.FC = () => (
  <Box
    sx={{
      background: "var(--bg)",
      border: "1px solid var(--border)",
      borderLeft: "3px solid var(--border2)",
      borderRadius: "var(--r)",
      padding: "10px 11px 10px 10px",
      animation: "pulse 1.4s ease-in-out infinite",
    }}
  >
    <Box sx={{ display: "flex", gap: "6px", mb: "8px" }}>
      <Box
        sx={{ width: 52, height: 16, borderRadius: 4, background: "var(--s2)" }}
      />
    </Box>
    <Box
      sx={{ height: 12, borderRadius: 4, background: "var(--s2)", mb: "6px" }}
    />
    <Box
      sx={{
        height: 12,
        borderRadius: 4,
        background: "var(--s2)",
        width: "70%",
        mb: "9px",
      }}
    />
    <Box sx={{ display: "flex", gap: "6px" }}>
      <Box
        sx={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: "var(--s2)",
        }}
      />
      <Box
        sx={{ width: 48, height: 10, borderRadius: 4, background: "var(--s2)" }}
      />
    </Box>
  </Box>
);
