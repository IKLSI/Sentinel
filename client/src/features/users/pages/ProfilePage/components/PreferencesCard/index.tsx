import type React from "react";
import Box from "@mui/material/Box";
import DarkModeOutlined from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlined from "@mui/icons-material/LightModeOutlined";
import TranslateOutlined from "@mui/icons-material/TranslateOutlined";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { useUpdatePreferencesMutation } from "@/domains/users/mutations";
import { useT, useI18n } from "@/contexts/I18nContext";
import { Language, Theme } from "@/enums";
import { CARD_SX } from "@/features/users/pages/ProfilePage/constants";
import { CardHeader } from "@/components/ui/common/CardHeader";
import { LanguageFlag } from "@/features/users/pages/ProfilePage/components/PreferencesCard/components/LanguageFlag";
import { PreviewOptionCard } from "@/features/users/pages/ProfilePage/components/PreferencesCard/components/PreviewOptionCard";

const LANGUAGE_OPTIONS = [
  {
    code: Language.Fr,
    labelKey: "profile.language.fr",
    bg: "linear-gradient(150deg,var(--flag-1) 55%,var(--flag-2) 100%)",
  },
  {
    code: Language.En,
    labelKey: "profile.language.en",
    bg: "linear-gradient(150deg,var(--flag-1) 45%,var(--flag-3) 100%)",
  },
] as const;

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

const PICKER_LABEL_SX = {
  fontSize: "12px",
  fontWeight: 600,
  color: "var(--text)",
  mb: "8px",
} as const;

const OPTIONS_ROW_SX = { display: "flex", gap: "8px" } as const;

export const PreferencesCard: React.FC = () => {
  const { user, setUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const t = useT();
  const { culture, setLanguage } = useI18n();

  const updatePrefs = useUpdatePreferencesMutation();

  const handleThemeToggle = (mode: Theme) => {
    if (theme === mode) return;
    toggleTheme();
  };

  const handleLanguageChange = (lang: Language) => {
    if (culture === lang || !user) return;
    setLanguage(lang);
    setUser({ ...user, language: lang });
    updatePrefs.mutate({ data: { language: lang } });
  };

  return (
    <Box sx={CARD_SX}>
      <CardHeader label={t("profile.section.preferences")} />

      <Box
        sx={{
          px: "16px",
          py: "12px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "16px",
        }}
      >
        <Box>
          <Box sx={PICKER_LABEL_SX}>{t("profile.field.language")}</Box>
          <Box sx={OPTIONS_ROW_SX}>
            {LANGUAGE_OPTIONS.map(({ code, labelKey, bg }) => (
              <PreviewOptionCard
                key={code}
                selected={culture === code}
                onClick={() => handleLanguageChange(code)}
                previewSx={{
                  height: 40,
                  background: bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                preview={<LanguageFlag language={code} />}
                footerBackground="var(--s2)"
                icon={
                  <TranslateOutlined
                    sx={{ fontSize: 8, color: "var(--muted)" }}
                  />
                }
                label={t(labelKey)}
                labelColor="var(--muted)"
              />
            ))}
          </Box>
        </Box>

        <Box>
          <Box sx={PICKER_LABEL_SX}>{t("profile.field.appearance")}</Box>
          <Box sx={OPTIONS_ROW_SX}>
            {([Theme.Light, Theme.Dark] as const).map((mode) => {
              const preview = THEME_PREVIEW[mode];
              return (
                <PreviewOptionCard
                  key={mode}
                  selected={theme === mode}
                  onClick={() => handleThemeToggle(mode)}
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
                    <preview.Icon
                      sx={{ fontSize: 8, color: preview.iconColor }}
                    />
                  }
                  label={t(preview.labelKey)}
                  labelColor={preview.labelColor}
                />
              );
            })}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
