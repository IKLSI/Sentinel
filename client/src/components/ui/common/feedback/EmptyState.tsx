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
    <Box
      sx={{
        width: iconSize * 2,
        height: iconSize * 2,
        mb: "16px",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "color-mix(in srgb, var(--accent) 8%, transparent)",
        border: "1px dashed var(--border2)",
      }}
    >
      <Icon
        sx={{
          fontSize: iconSize,
          color: "var(--muted)",
          opacity: 0.7,
        }}
      />
    </Box>
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
