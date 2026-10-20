import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import { LanguageFlag } from "@/components/ui/common/LanguageFlag";
import { useI18n } from "@/contexts/I18nContext";
import { Language } from "@/enums";
import {
  LANDING_NAV_HEIGHT,
  LANDING_NAV_TOP,
} from "@/features/landing/constants";

const OPTIONS = [
  { code: Language.Fr, shortCode: "FR", labelKey: "profile.language.fr" },
  { code: Language.En, shortCode: "EN", labelKey: "profile.language.en" },
] as const;

interface OptionsProps {
  alwaysShowCode?: boolean;
}

export const LanguageOptions = ({ alwaysShowCode = false }: OptionsProps) => {
  const { t, culture, setLanguage } = useI18n();

  return (
    <>
      {OPTIONS.map(({ code, shortCode, labelKey }) => {
        const active = culture === code;
        const showCode = alwaysShowCode || active;
        return (
          <ButtonBase
            key={code}
            aria-label={t(labelKey)}
            aria-pressed={active}
            onClick={() => setLanguage(code)}
            sx={{
              px: "14px",
              py: "10px",
              borderRadius: "999px",
              color: active ? "#ffffff" : "var(--text-secondary)",
              background: active ? "var(--accent)" : "transparent",
              boxShadow: active
                ? "0 6px 14px -6px var(--accent-border)"
                : "none",
              transition: "background 0.2s, color 0.2s, box-shadow 0.2s",
              "&:hover": {
                background: active ? "var(--accent)" : "var(--s3)",
              },
              "&.Mui-focusVisible": {
                outline: "2px solid var(--accent)",
                outlineOffset: "2px",
              },
            }}
          >
            <LanguageFlag language={code} width={22} height={15} />
            <Box
              component="span"
              sx={{
                overflow: "hidden",
                whiteSpace: "nowrap",
                maxWidth: showCode ? 28 : 0,
                ml: showCode ? "6px" : 0,
                opacity: showCode ? 1 : 0,
                fontSize: "12px",
                fontWeight: 700,
                letterSpacing: "0.06em",
                transition:
                  "max-width 0.25s ease, margin 0.25s ease, opacity 0.2s",
              }}
            >
              {shortCode}
            </Box>
          </ButtonBase>
        );
      })}
    </>
  );
};

export const LanguageSwitch = () => (
  <Box
    sx={{
      position: "fixed",
      top: LANDING_NAV_TOP,
      right: { md: "24px" },
      zIndex: 110,
      display: { xs: "none", md: "flex" },
      alignItems: "stretch",
      gap: "2px",
      height: LANDING_NAV_HEIGHT,
      boxSizing: "border-box",
      p: "6px",
      borderRadius: "999px",
      border: "1px solid var(--border)",
      background: "color-mix(in srgb, var(--s1) 82%, transparent)",
      backdropFilter: "blur(18px) saturate(160%)",
      boxShadow: "var(--sh-2)",
    }}
  >
    <LanguageOptions />
  </Box>
);
