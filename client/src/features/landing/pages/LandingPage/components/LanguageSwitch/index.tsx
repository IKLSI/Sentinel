import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import { LanguageFlag } from "@/components/ui/common/LanguageFlag";
import { useI18n } from "@/contexts/I18nContext";
import { Language } from "@/enums";

const OPTIONS = [
  { code: Language.Fr, shortCode: "FR", labelKey: "profile.language.fr" },
  { code: Language.En, shortCode: "EN", labelKey: "profile.language.en" },
] as const;

export const LanguageSwitch = () => {
  const { t, culture, setLanguage } = useI18n();

  return (
    <Box
      sx={{
        position: "fixed",
        top: { xs: "20px", md: "24px" },
        right: { xs: "16px", md: "24px" },
        zIndex: 110,
        display: "flex",
        alignItems: "center",
        gap: "2px",
        p: "4px",
        borderRadius: "999px",
        border: "1px solid var(--border)",
        background: "color-mix(in srgb, var(--s1) 82%, transparent)",
        backdropFilter: "blur(18px) saturate(160%)",
        boxShadow: "var(--sh-2)",
      }}
    >
      {OPTIONS.map(({ code, shortCode, labelKey }) => {
        const active = culture === code;
        return (
          <ButtonBase
            key={code}
            aria-label={t(labelKey)}
            aria-pressed={active}
            onClick={() => setLanguage(code)}
            sx={{
              height: 36,
              px: "10px",
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
                maxWidth: active ? 28 : 0,
                ml: active ? "6px" : 0,
                opacity: active ? 1 : 0,
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
    </Box>
  );
};
