import type React from "react";
import Box from "@mui/material/Box";

interface Props {
  title: string;
  action?: React.ReactNode;
  scrollable?: boolean;
  children: React.ReactNode;
}

export const DashboardCard: React.FC<Props> = ({
  title,
  action,
  scrollable = true,
  children,
}) => (
  <Box
    component="section"
    sx={{
      background: "var(--s1)",
      border: "1px solid var(--border)",
      borderRadius: "var(--r-lg)",
      boxShadow: "var(--sh-1)",
      p: "16px 20px",
      display: "flex",
      flexDirection: "column",
      minWidth: 0,
      minHeight: 0,
      height: "100%",
      boxSizing: "border-box",
    }}
  >
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        gap: "12px",
        mx: "-20px",
        px: "20px",
        pb: "12px",
        mb: "10px",
        borderBottom: "1px solid var(--border)",
        flexShrink: 0,
      }}
    >
      <Box
        component="h2"
        sx={{
          m: 0,
          minWidth: 0,
          typography: "cardTitle",
          color: "var(--text)",
        }}
      >
        {title}
      </Box>
      {action}
    </Box>
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        mr: "-14px",
        pr: "14px",
        overflowY: scrollable ? "auto" : "hidden",
        overflowX: "hidden",
        "&::-webkit-scrollbar-thumb": { background: "var(--border)" },
        "&:hover::-webkit-scrollbar-thumb": { background: "var(--border2)" },
        "@supports not selector(::-webkit-scrollbar)": {
          scrollbarWidth: "thin",
          scrollbarColor: "var(--border) transparent",
          "&:hover": { scrollbarColor: "var(--border2) transparent" },
        },
      }}
    >
      {children}
    </Box>
  </Box>
);
