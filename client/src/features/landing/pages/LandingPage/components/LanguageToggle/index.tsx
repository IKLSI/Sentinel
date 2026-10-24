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

const other = (code: Language) =>
  OPTIONS.find((option) => option.code !== code)?.code ?? code;

export const LanguageToggle: React.FC = () => {
  const { t, culture, setLanguage } = useI18n();
  const activeIndex = Math.max(
    OPTIONS.findIndex(({ code }) => code === culture),
    0,
  );

  return (
    <Box
      role="group"
      aria-label={t("profile.field.language")}
      sx={{
        position: "relative",
        display: "grid",
        gridTemplateColumns: `repeat(${OPTIONS.length}, 1fr)`,
        alignItems: "center",
        p: "3px",
        borderRadius: "16px",
      }}
    >
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          top: "3px",
          bottom: "3px",
          left: "3px",
          width: `calc((100% - 6px) / ${OPTIONS.length})`,
          borderRadius: "13px",
          background:
            "linear-gradient(180deg, var(--page), color-mix(in srgb, var(--page) 92%, var(--ink)))",
          boxShadow:
            "inset 0 1px 0 var(--page), 0 0 0 1px color-mix(in srgb, var(--ink) 7%, transparent), 0 6px 12px -6px color-mix(in srgb, var(--ink) 30%, transparent)",
          transform: `translateX(${activeIndex * 100}%)`,
          transition: "transform .35s cubic-bezier(.3,1.3,.5,1)",
          "@media (prefers-reduced-motion: reduce)": { transition: "none" },
        }}
      />
      {OPTIONS.map(({ code, shortCode, nameKey }) => {
        const active = culture === code;
        return (
          <ButtonBase
            key={code}
            aria-pressed={active}
            aria-label={t(nameKey)}
            onClick={() => setLanguage(active ? other(code) : code)}
            sx={{
              position: "relative",
              height: 38,
              minWidth: 52,
              px: "14px",
              borderRadius: "13px",
              fontFamily: "var(--font-text)",
              fontSize: "13px",
              fontWeight: active ? 700 : 500,
              letterSpacing: "0.06em",
              color: active ? "var(--ink)" : "var(--ink-3)",
              transition: "color .25s, font-weight .25s",
              "&:hover": { color: "var(--ink)" },
              "&.Mui-focusVisible": {
                outline: "2px solid var(--ink)",
                outlineOffset: "2px",
              },
            }}
          >
            {shortCode}
          </ButtonBase>
        );
      })}
    </Box>
  );
};
