import type React from "react";
import Box from "@mui/material/Box";
import TranslateOutlined from "@mui/icons-material/TranslateOutlined";
import { LanguageFlag } from "@/components/ui/common/LanguageFlag";
import { useT } from "@/contexts/I18nContext";
import { Language } from "@/enums";
import { PreviewOptionCard } from "@/features/users/pages/ProfilePage/components/PreviewOptionCard";

interface Props {
  culture: Language;
  onChange: (lang: Language) => void;
}

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
        {LANGUAGE_OPTIONS.map(({ code, labelKey, bg }) => (
          <PreviewOptionCard
            key={code}
            selected={culture === code}
            onClick={() => onChange(code)}
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
              <TranslateOutlined sx={{ fontSize: 8, color: "var(--muted)" }} />
            }
            label={t(labelKey)}
            labelColor="var(--muted)"
          />
        ))}
      </Box>
    </Box>
  );
};
