import type React from "react";
import Box from "@mui/material/Box";
import CheckOutlined from "@mui/icons-material/CheckOutlined";
import TranslateOutlined from "@mui/icons-material/TranslateOutlined";
import { LanguageFlag } from "@/components/ui/common/LanguageFlag";
import { useT } from "@/contexts/I18nContext";
import { Language } from "@/enums";

interface Props {
  culture: Language;
  onChange: (lang: Language) => void;
}

export const LanguagePicker: React.FC<Props> = ({ culture, onChange }) => {
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
        {t("profile.field.language")}
      </Box>
      <Box sx={{ display: "flex", gap: "8px" }}>
        {[
          {
            code: Language.Fr,
            label: t("profile.language.fr"),
            bg: "linear-gradient(150deg,var(--flag-1) 55%,var(--flag-2) 100%)",
          },
          {
            code: Language.En,
            label: t("profile.language.en"),
            bg: "linear-gradient(150deg,var(--flag-1) 45%,var(--flag-3) 100%)",
          },
        ].map(({ code, label, bg }) => (
          <Box
            key={code}
            component="button"
            type="button"
            onClick={() => onChange(code)}
            sx={{
              all: "unset",
              cursor: "pointer",
              width: 100,
              boxSizing: "border-box",
              borderRadius: "var(--r-sm)",
              overflow: "hidden",
              border:
                culture === code
                  ? "2px solid var(--accent)"
                  : "2px solid var(--border)",
              boxShadow:
                culture === code ? "0 0 0 2px var(--accent-subtle)" : "none",
              transition: "all 0.15s",
            }}
          >
            <Box
              sx={{
                height: 40,
                background: bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <LanguageFlag language={code} />
            </Box>
            <Box
              sx={{
                px: "8px",
                py: "4px",
                background: "var(--s2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: "3px",
                }}
              >
                <TranslateOutlined
                  sx={{ fontSize: 8, color: "var(--muted)" }}
                />
                <Box
                  sx={{
                    fontSize: "9px",
                    fontWeight: 600,
                    color: "var(--muted)",
                  }}
                >
                  {label}
                </Box>
              </Box>
              {culture === code && (
                <Box
                  sx={{
                    width: 11,
                    height: 11,
                    borderRadius: "50%",
                    background: "var(--accent)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CheckOutlined sx={{ fontSize: 7, color: "var(--s1)" }} />
                </Box>
              )}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
};
