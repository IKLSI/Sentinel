import type React from "react";
import Box from "@mui/material/Box";

interface Props {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

export const DashboardCard: React.FC<Props> = ({
  title,
  subtitle,
  action,
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
        alignItems: subtitle ? "center" : "baseline",
        gap: "12px",
        mx: "-20px",
        px: "20px",
        pb: "12px",
        mb: "10px",
        borderBottom: "1px solid var(--border)",
        flexShrink: 0,
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Box
          component="h2"
          sx={{
            m: 0,
            fontSize: "12px",
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "var(--text)",
          }}
        >
          {title}
        </Box>
        {subtitle && (
          <Box sx={{ mt: "3px", color: "var(--muted2)", fontSize: "11px" }}>
            {subtitle}
          </Box>
        )}
      </Box>
      {action}
    </Box>
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
        overflowX: "hidden",
        scrollbarWidth: "thin",
        scrollbarColor: "var(--border2) transparent",
      }}
    >
      {children}
    </Box>
  </Box>
);
