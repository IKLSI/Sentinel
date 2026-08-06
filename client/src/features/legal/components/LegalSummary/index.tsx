import type React from "react";
import Box from "@mui/material/Box";
import { useT } from "@/contexts/I18nContext";
import { LEGAL_HEADER_HEIGHT } from "@/features/legal/constants";
import { numbered, scrollToSection } from "@/features/legal/helpers";
import type { LegalSection } from "@/features/legal/types";

interface Props {
  sections: LegalSection[];
  activeId: string;
}

export const LegalSummary: React.FC<Props> = ({ sections, activeId }) => {
  const t = useT();

  return (
    <Box
      component="nav"
      className="legal-no-print"
      sx={{
        position: "sticky",
        top: `${LEGAL_HEADER_HEIGHT + 24}px`,
      }}
    >
      <Box
        sx={{
          fontFamily: "var(--font-mono)",
          fontSize: { xs: "9px", lg: "10px" },
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--muted)",
          pl: { xs: "10px", lg: "14px" },
          mb: { xs: "8px", lg: "12px" },
        }}
      >
        {t("legal.shell.summary")}
      </Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          borderLeft: "1px solid var(--border)",
        }}
      >
        {sections.map((section, index) => {
          const active = section.id === activeId;
          return (
            <Box
              key={section.id}
              component="button"
              type="button"
              onClick={() => scrollToSection(section.id)}
              sx={{
                display: "flex",
                gap: { xs: "6px", lg: "9px" },
                alignItems: "baseline",
                textAlign: "left",
                ml: "-1px",
                pl: { xs: "9px", lg: "13px" },
                pr: { xs: "4px", lg: "8px" },
                py: { xs: "6px", lg: "7px" },
                border: "none",
                borderLeft: `2px solid ${active ? "var(--accent)" : "transparent"}`,
                background: active
                  ? "linear-gradient(90deg, var(--accent-subtle) 0%, transparent 90%)"
                  : "transparent",
                color: active ? "var(--accent)" : "var(--muted2)",
                fontFamily: "inherit",
                fontSize: { xs: "11px", lg: "12px" },
                fontWeight: active ? 600 : 500,
                lineHeight: 1.45,
                cursor: "pointer",
                transition: "color 0.15s, border-color 0.15s",
                "&:hover": { color: "var(--text)" },
              }}
            >
              <Box
                component="span"
                sx={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "10px",
                  opacity: 0.7,
                }}
              >
                {numbered(index)}
              </Box>
              <Box component="span">{t(section.titleKey)}</Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};
