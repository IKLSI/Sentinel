import type React from "react";
import type { SvgIconComponent } from "@mui/icons-material";
import Box from "@mui/material/Box";
import type { SxProps, Theme } from "@mui/material/styles";

interface Props {
  icon: SvgIconComponent;
  title: string;
  subtitle: string;
  sx?: SxProps<Theme>;
  iconSize?: number;
}

export const EmptyState: React.FC<Props> = ({
  icon: Icon,
  title,
  subtitle,
  sx,
  iconSize = 32,
}) => (
  <Box className="empty-state" sx={{ padding: "24px !important", ...sx }}>
    <Box className="empty-state-icon">
      <Icon sx={{ fontSize: iconSize }} />
    </Box>
    <Box className="empty-state-title" sx={{ fontSize: "16px !important" }}>
      {title}
    </Box>
    <Box className="empty-state-subtitle" sx={{ fontSize: "14px !important" }}>
      {subtitle}
    </Box>
  </Box>
);
