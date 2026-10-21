import type React from "react";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import { useI18n } from "@/contexts/I18nContext";
import { Language } from "@/enums";

const OPTIONS = [
  {
    code: Language.Fr,
    shortCode: "FR",
    nameKey: "landing.footer.language_fr",
  },
  {
    code: Language.En,
    shortCode: "EN",
    nameKey: "landing.footer.language_en",
  },
] as const;

interface LanguageToggleProps {
  size: "sm" | "lg";
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({ size }) => {
  const { t, culture, setLanguage } = useI18n();
  const isLarge = size === "lg";

  return (
    <Box
      role="group"
      aria-label={t("profile.field.language")}
      sx={{
        display: "inline-flex",
        p: "3px",
        borderRadius: "999px",
        background: "var(--tint)",
        boxShadow: "inset 0 0 0 1px var(--line)",
      }}
    >
      {OPTIONS.map(({ code, shortCode, nameKey }) => {
        const active = culture === code;
        return (
          <ButtonBase
            key={code}
            aria-pressed={active}
            aria-label={isLarge ? undefined : t(nameKey)}
            onClick={() => setLanguage(code)}
            sx={{
              px: isLarge ? "14px" : "9px",
              py: isLarge ? "7px" : "4px",
              borderRadius: "999px",
              fontFamily: "var(--font-text)",
              fontSize: isLarge ? "13.5px" : "12px",
              fontWeight: 500,
              color: active ? "var(--ink)" : "var(--ink-3)",
              background: active ? "#ffffff" : "transparent",
              boxShadow: active ? "0 1px 3px rgba(16,17,36,.1)" : "none",
              transition: "background .2s, color .2s",
              "&:hover": { color: "var(--ink)" },
              "&.Mui-focusVisible": {
                outline: "2px solid var(--indigo)",
                outlineOffset: "2px",
              },
            }}
          >
            {isLarge ? t(nameKey) : shortCode}
          </ButtonBase>
        );
      })}
    </Box>
  );
};
