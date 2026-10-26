import type React from "react";
import Box from "@mui/material/Box";
import DarkModeOutlined from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlined from "@mui/icons-material/LightModeOutlined";
import { useT } from "@/contexts/I18nContext";
import { Theme } from "@/enums";
import { PreviewOptionCard } from "@/features/users/pages/ProfilePage/components/PreviewOptionCard";

interface Props {
  theme: Theme;
  onChange: (mode: Theme) => void;
}

const THEME_PREVIEW = {
  [Theme.Light]: {
    background: "linear-gradient(150deg,#fff 55%,var(--preview-lt-bg) 100%)",
    bars: [
      { width: "60%", color: "var(--preview-lt-bar1)" },
      { width: "80%", color: "var(--preview-lt-bar2)" },
      { width: "40%", color: "var(--preview-lt-accent)" },
    ],
    footerBackground: "var(--preview-lt-bg)",
    Icon: LightModeOutlined,
    iconColor: "var(--preview-lt-text-soft)",
    labelColor: "var(--preview-lt-text-strong)",
    labelKey: "profile.theme.light",
  },
  [Theme.Dark]: {
    background:
      "linear-gradient(150deg,var(--preview-dk-surface) 55%,var(--preview-dk-surface2) 100%)",
    bars: [
      { width: "60%", color: "var(--preview-dk-bar1)" },
      { width: "80%", color: "var(--preview-dk-bar2)" },
      { width: "40%", color: "var(--preview-dk-accent)" },
    ],
    footerBackground: "var(--preview-dk-bg)",
    Icon: DarkModeOutlined,
    iconColor: "var(--preview-dk-text-soft)",
    labelColor: "var(--preview-dk-text-strong)",
    labelKey: "profile.theme.dark",
  },
} as const;

export const AppearancePicker: React.FC<Props> = ({ theme, onChange }) => {
  const t = useT();
  return (
    <Box>
      <Box
        sx={{
          fontSize: "12px",
          fontWeight: 600,
          color: "var(--text)",
          mb: "8px",
        }}
      >
        {t("profile.field.appearance")}
      </Box>
      <Box sx={{ display: "flex", gap: "8px" }}>
        {([Theme.Light, Theme.Dark] as const).map((mode) => {
          const preview = THEME_PREVIEW[mode];
          return (
            <PreviewOptionCard
              key={mode}
              selected={theme === mode}
              onClick={() => onChange(mode)}
              previewSx={{
                height: 40,
                background: preview.background,
                p: "6px 8px",
                display: "flex",
                flexDirection: "column",
                gap: "3px",
              }}
              preview={preview.bars.map((bar) => (
                <Box
                  key={bar.width}
                  sx={{
                    height: 3,
                    width: bar.width,
                    borderRadius: "var(--r-xs)",
                    background: bar.color,
                  }}
                />
              ))}
              footerBackground={preview.footerBackground}
              icon={
                <preview.Icon sx={{ fontSize: 8, color: preview.iconColor }} />
              }
              label={t(preview.labelKey)}
              labelColor={preview.labelColor}
            />
          );
        })}
      </Box>
    </Box>
  );
};
