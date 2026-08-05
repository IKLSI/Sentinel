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

export const LegalSummaryBar: React.FC<Props> = ({ sections, activeId }) => {
  const t = useT();

  return (
    <Box
      className="legal-no-print"
      sx={{
        display: { xs: "block", lg: "none" },
        position: "sticky",
        top: `${LEGAL_HEADER_HEIGHT}px`,
        zIndex: 15,
        borderBottom: "1px solid var(--border)",
        background: "color-mix(in srgb, var(--bg) 92%, transparent)",
        backdropFilter: "blur(14px)",
      }}
    >
      <Box
        sx={{
          display: "flex",
          gap: "7px",
          overflowX: "auto",
          px: "18px",
          py: "9px",
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
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
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                flexShrink: 0,
                px: "10px",
                height: "26px",
                borderRadius: "var(--r-sm)",
                border: `1px solid ${active ? "var(--accent-border)" : "var(--border)"}`,
                background: active ? "var(--accent-subtle)" : "var(--s1)",
                color: active ? "var(--accent)" : "var(--muted2)",
                fontFamily: "inherit",
                fontSize: "11.5px",
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              <Box
                component="span"
                sx={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "9.5px",
                  opacity: 0.75,
                }}
              >
                {numbered(index)}
              </Box>
              {t(section.titleKey)}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};
