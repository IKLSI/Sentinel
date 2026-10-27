import type React from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import ArrowForwardOutlined from "@mui/icons-material/ArrowForwardOutlined";
import LinkOutlined from "@mui/icons-material/LinkOutlined";
import { Link } from "@tanstack/react-router";
import { useT } from "@/contexts/I18nContext";
import { LEGAL_SCROLL_OFFSET } from "@/features/legal/constants";
import { numbered } from "@/features/legal/components/LegalDocument/helpers";
import type { LegalSection } from "@/features/legal/types";

interface Props {
  prefix: string;
  section: LegalSection;
  index: number;
  onCopyAnchor: (id: string) => void;
}

export const LegalSectionCard: React.FC<Props> = ({
  prefix,
  section,
  index,
  onCopyAnchor,
}) => {
  const t = useT();
  const sectionKey = `${prefix}.${section.id}`;

  return (
    <Box
      id={section.id}
      component="section"
      sx={{
        p: { xs: "22px 18px", md: "30px 34px" },
        scrollMarginTop: `${LEGAL_SCROLL_OFFSET}px`,
        borderTop: index === 0 ? "none" : "1px solid var(--border)",
        "&:hover .legal-anchor": { opacity: 1 },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <Box
          sx={{
            fontFamily: "var(--font-mono)",
            fontSize: "15px",
            fontWeight: 700,
            color: "var(--accent)",
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
          }}
        >
          {numbered(index)}
        </Box>
        <Box
          component="h2"
          sx={{
            m: 0,
            fontSize: "15px",
            fontWeight: 600,
            letterSpacing: "-0.02em",
          }}
        >
          {t(`${sectionKey}.title`)}
        </Box>
        <Tooltip title={t("legal.shell.copy_anchor")} arrow>
          <IconButton
            type="button"
            className="legal-anchor legal-no-print"
            onClick={() => onCopyAnchor(section.id)}
            sx={{
              p: 0,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "24px",
              height: "24px",
              border: "none",
              background: "transparent",
              borderRadius: "var(--r-xs)",
              color: "var(--muted)",
              cursor: "pointer",
              opacity: 0,
              transition: "opacity 0.15s, color 0.15s",
              "&:hover": { color: "var(--accent)" },
              "&:focus-visible": { opacity: 1 },
            }}
          >
            <LinkOutlined sx={{ fontSize: 14 }} />
          </IconButton>
        </Tooltip>
      </Box>

      <Box
        component="p"
        sx={{
          m: "14px 0 0",
          fontSize: "13px",
          lineHeight: 1.8,
          color: "var(--text-secondary)",
        }}
      >
        {t(`${sectionKey}.body`)}
      </Box>

      {section.bulletKeys && (
        <Box
          component="ul"
          sx={{
            listStyle: "none",
            m: "16px 0 0",
            p: 0,
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          {section.bulletKeys.map((key) => (
            <Box
              key={key}
              component="li"
              sx={{
                display: "flex",
                gap: "11px",
                px: "12px",
                py: "9px",
                borderRadius: "var(--r-sm)",
                background: "var(--s2)",
                border: "1px solid transparent",
                fontSize: "12.5px",
                lineHeight: 1.7,
                color: "var(--text-secondary)",
                transition: "border-color 0.15s, background 0.15s",
                "&:hover": { borderColor: "var(--border)" },
              }}
            >
              <Box
                sx={{
                  flexShrink: 0,
                  width: "5px",
                  height: "5px",
                  mt: "8px",
                  borderRadius: "50%",
                  background: "var(--accent)",
                }}
              />
              <Box component="span">{t(key)}</Box>
            </Box>
          ))}
        </Box>
      )}

      {section.entryKeys && (
        <Box
          sx={{
            mt: "18px",
            border: "1px solid var(--border)",
            borderRadius: "var(--r)",
            overflow: "hidden",
          }}
        >
          {section.entryKeys.map((entry, entryIndex) => (
            <Box
              key={entry}
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "minmax(140px, 210px) 1fr",
                },
                gap: { xs: "3px", sm: "20px" },
                px: "14px",
                py: "11px",
                borderTop:
                  entryIndex === 0 ? "none" : "1px solid var(--border)",
                background: entryIndex % 2 === 0 ? "var(--s2)" : "transparent",
              }}
            >
              <Box
                sx={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "10.5px",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  color: "var(--muted)",
                  pt: "2px",
                }}
              >
                {t(`${entry}.label`)}
              </Box>
              <Box
                sx={{
                  fontSize: "12.5px",
                  lineHeight: 1.65,
                  color: "var(--text)",
                }}
              >
                {t(`${entry}.value`)}
              </Box>
            </Box>
          ))}
        </Box>
      )}

      {section.linkKey && section.linkTo && (
        <Link to={section.linkTo} style={{ textDecoration: "none" }}>
          <Box
            sx={{
              p: 0,
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              mt: "16px",
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--accent)",
              transition: "gap 0.15s",
              "&:hover": { gap: "11px" },
            }}
          >
            {t(section.linkKey)}
            <ArrowForwardOutlined sx={{ fontSize: 14 }} />
          </Box>
        </Link>
      )}
    </Box>
  );
};
