import type React from "react";
import type { SvgIconComponent } from "@mui/icons-material";
import Box from "@mui/material/Box";
import type { SxProps, Theme } from "@mui/material/styles";

interface Props {
  icon: SvgIconComponent;
  title: string;
  subtitle: string;
  sx?: SxProps<Theme>;
}

export const EmptyState: React.FC<Props> = ({
  icon: Icon,
  title,
  subtitle,
  sx,
}) => (
  <Box className="empty-state" sx={{ padding: "24px !important", ...sx }}>
    <Box className="empty-state-icon">
      <Icon sx={{ fontSize: 32 }} />
    </Box>
    <Box className="empty-state-title" sx={{ fontSize: "12px !important" }}>
      {title}
    </Box>
    <Box className="empty-state-subtitle" sx={{ fontSize: "11px !important" }}>
      {subtitle}
    </Box>
  </Box>
);
