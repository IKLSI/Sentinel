import type React from "react";
import type { SvgIconComponent } from "@mui/icons-material";
import Box from "@mui/material/Box";
import type { SxProps, Theme } from "@mui/material/styles";

interface Props {
  icon: SvgIconComponent;
  title: string;
  subtitle?: string;
  sx?: SxProps<Theme>;
  iconSize?: number;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<Props> = ({
  icon: Icon,
  title,
  subtitle,
  sx,
  iconSize = 32,
  action,
}) => (
  <Box
    sx={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      p: "24px",
      textAlign: "center",
      ...sx,
    }}
  >
    <Icon
      sx={{
        fontSize: iconSize,
        mb: "20px",
        color: "var(--muted)",
        opacity: 0.4,
      }}
    />
    <Box
      sx={{
        mb: "6px",
        fontSize: "16px",
        fontWeight: 600,
        letterSpacing: "-0.02em",
        color: "var(--text)",
      }}
    >
      {title}
    </Box>
    {subtitle && (
      <Box sx={{ fontSize: "14px", lineHeight: 1.6, color: "var(--muted2)" }}>
        {subtitle}
      </Box>
    )}
    {action && <Box sx={{ mt: "16px" }}>{action}</Box>}
  </Box>
);
