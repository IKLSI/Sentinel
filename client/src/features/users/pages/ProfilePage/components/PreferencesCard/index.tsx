import type React from "react";
import Box from "@mui/material/Box";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { useUpdatePreferencesMutation } from "@/domains/users/mutations";
import { useT, useI18n } from "@/contexts/I18nContext";
import type { Theme, Language } from "@/enums";
import { CARD_SX } from "@/features/users/pages/ProfilePage/constants";
import { InnerDivider } from "@/features/users/pages/ProfilePage/components/InnerDivider";
import { LanguagePicker } from "@/features/users/pages/ProfilePage/components/LanguagePicker";
import { AppearancePicker } from "@/features/users/pages/ProfilePage/components/AppearancePicker";

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
      <InnerDivider label={t("profile.section.preferences")} />

      <Box
        sx={{
          px: "16px",
          py: "12px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "16px",
        }}
      >
        <LanguagePicker culture={culture} onChange={handleLanguageChange} />
        <AppearancePicker theme={theme} onChange={handleThemeToggle} />
      </Box>
    </Box>
  );
};
