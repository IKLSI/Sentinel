import type React from "react";
import Box from "@mui/material/Box";
import ErrorOutlineOutlined from "@mui/icons-material/ErrorOutlineOutlined";
import WarningAmberOutlined from "@mui/icons-material/WarningAmberOutlined";
import { useT } from "@/contexts/I18nContext";

type Tone = "error" | "warning";

const TONES: Record<
  Tone,
  { color: string; background: string; icon: typeof WarningAmberOutlined }
> = {
  error: {
    color: "var(--red)",
    background: "color-mix(in srgb, var(--red) 12%, transparent)",
    icon: ErrorOutlineOutlined,
  },
  warning: {
    color: "var(--orange)",
    background: "var(--orange-subtle)",
    icon: WarningAmberOutlined,
  },
};

interface Props {
  messageKey: string;
  tone: Tone;
}

export const ScanWarningBanner: React.FC<Props> = ({ messageKey, tone }) => {
  const t = useT();
  const { color, background, icon: Icon } = TONES[tone];

  return (
    <Box
      role="status"
      sx={{
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        gap: "10px",
        mb: "16px",
        px: "14px",
        py: "10px",
        background,
        border: `1px solid color-mix(in srgb, ${color} 28%, transparent)`,
        borderRadius: "var(--r)",
        color,
        fontSize: "13px",
        lineHeight: 1.45,
      }}
    >
      <Icon sx={{ fontSize: 18, flexShrink: 0 }} />
      <Box component="span">{t(messageKey)}</Box>
    </Box>
  );
};
