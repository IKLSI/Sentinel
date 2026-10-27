import type React from "react";
import { useCallback, useMemo } from "react";
import Box from "@mui/material/Box";
import { Link } from "@tanstack/react-router";
import { useT } from "@/contexts/I18nContext";
import { BackToTopButton } from "@/features/legal/components/LegalDocument/components/BackToTopButton";
import { LegalContactCard } from "@/features/legal/components/LegalDocument/components/LegalContactCard";
import { LegalHeader } from "@/features/legal/components/LegalDocument/components/LegalHeader";
import { LegalSectionCard } from "@/features/legal/components/LegalDocument/components/LegalSectionCard";
import { LegalSummary } from "@/features/legal/components/LegalDocument/components/LegalSummary";
import {
  LEGAL_CONTENT_SX,
  LEGAL_DOCUMENTS,
  LEGAL_SCROLL_OFFSET,
} from "@/features/legal/constants";
import type { LegalSection } from "@/features/legal/types";
import { useActiveSection } from "@/hooks/useActiveSection";
import { useToast } from "@/hooks/useToast";

interface Props {
  documentId: string;
  prefix: string;
  sections: LegalSection[];
}

export const LegalDocument: React.FC<Props> = ({
  documentId,
  prefix,
  sections,
}) => {
  const t = useT();
  const { showToast } = useToast();
  const sectionIds = useMemo(
    () => sections.map((section) => section.id),
    [sections],
  );
  const activeId = useActiveSection(sectionIds, LEGAL_SCROLL_OFFSET + 20);

  const copyAnchor = useCallback(
    (id: string) => {
      const url = `${window.location.origin}${window.location.pathname}#${id}`;
      navigator.clipboard
        ?.writeText(url)
        .then(() => showToast(t("legal.shell.link_copied"), "success"))
        .catch(() => undefined);
    },
    [showToast, t],
  );

  return (
    <Box
      className="legal-doc"
      sx={{
        minHeight: "100dvh",
        background: "var(--bg)",
        color: "var(--text)",
        position: "relative",
        "&::before": {
          content: '""',
          position: "absolute",
          insetInline: 0,
          top: 0,
          height: "460px",
          background:
            "radial-gradient(ellipse 760px 340px at 50% 0%, var(--accent-subtle) 0%, transparent 72%)",
          pointerEvents: "none",
        },
      }}
    >
      <LegalHeader />

      <Box
        sx={{
          ...LEGAL_CONTENT_SX,
          position: "relative",
          pt: { xs: "30px", md: "52px" },
          pb: { xs: "48px", md: "76px" },
        }}
      >
        <Box
          component="h1"
          sx={{
            m: 0,
            fontSize: { xs: "25px", md: "33px" },
            fontWeight: 700,
            letterSpacing: "-0.035em",
            lineHeight: 1.12,
            textAlign: "center",
          }}
        >
          {t(`${prefix}.title`)}
        </Box>

        <Box
          component="p"
          sx={{
            m: "16px auto 0",
            maxWidth: "660px",
            fontSize: "13.5px",
            lineHeight: 1.75,
            color: "var(--muted2)",
            textAlign: "center",
          }}
        >
          {t(`${prefix}.subtitle`)}
        </Box>

        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            mt: "14px",
            fontSize: "11.5px",
            color: "var(--muted)",
          }}
        >
          <Box component="span">
            {t("legal.shell.updated", { date: t(`${prefix}.updated`) })}
          </Box>
          <Box
            sx={{
              width: "3px",
              height: "3px",
              borderRadius: "50%",
              background: "var(--border2)",
            }}
          />
          <Box component="span">
            {t("legal.shell.reading_time", { count: sections.length })}
          </Box>
        </Box>

        <Box
          className="legal-no-print"
          sx={{
            mt: "26px",
            pb: "2px",
            overflowX: "auto",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Box
            component="nav"
            sx={{
              display: "inline-flex",
              flexShrink: 0,
              gap: "3px",
              p: "3px",
              background: "var(--s2)",
              border: "1px solid var(--border)",
              borderRadius: "var(--r)",
            }}
          >
            {LEGAL_DOCUMENTS.map((entry) => {
              const active = entry.id === documentId;
              return (
                <Link
                  key={entry.id}
                  to={entry.to}
                  style={{ textDecoration: "none" }}
                >
                  <Box
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      px: "14px",
                      py: "7px",
                      borderRadius: "var(--r-sm)",
                      border: `1px solid ${active ? "var(--border)" : "transparent"}`,
                      background: active ? "var(--s1)" : "transparent",
                      boxShadow: active ? "var(--sh-1)" : "none",
                      color: active ? "var(--text)" : "var(--muted2)",
                      fontSize: "12px",
                      fontWeight: 600,
                      letterSpacing: "-0.01em",
                      whiteSpace: "nowrap",
                      transition: "color 0.15s, background 0.15s",
                      "&:hover": { color: "var(--text)" },
                    }}
                  >
                    {t(entry.labelKey)}
                  </Box>
                </Link>
              );
            })}
          </Box>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "124px minmax(0, 1fr)",
              sm: "180px minmax(0, 1fr)",
              lg: "244px minmax(0, 1fr)",
            },
            gap: { xs: "14px", sm: "24px", lg: "40px" },
            mt: "30px",
            alignItems: "start",
          }}
        >
          <LegalSummary
            prefix={prefix}
            sections={sections}
            activeId={activeId}
          />

          <Box>
            <Box
              component="article"
              sx={{
                background: "var(--s1)",
                border: "1px solid var(--border)",
                borderRadius: "var(--r-md)",
                boxShadow: "var(--sh-1)",
                overflow: "hidden",
              }}
            >
              {sections.map((section, index) => (
                <LegalSectionCard
                  key={section.id}
                  prefix={prefix}
                  section={section}
                  index={index}
                  onCopyAnchor={copyAnchor}
                />
              ))}
            </Box>

            <LegalContactCard />

            <Box
              component="footer"
              sx={{
                mt: "34px",
                pt: "18px",
                borderTop: "1px solid var(--border)",
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "14px",
                fontSize: "11.5px",
                color: "var(--muted)",
              }}
            >
              <Box>{t("legal.shell.copyright")}</Box>
              <Box
                className="legal-no-print"
                sx={{ display: "flex", flexWrap: "wrap", gap: "18px" }}
              >
                {LEGAL_DOCUMENTS.filter((entry) => entry.id !== documentId).map(
                  (entry) => (
                    <Link
                      key={entry.id}
                      to={entry.to}
                      style={{ textDecoration: "none" }}
                    >
                      <Box
                        sx={{
                          fontSize: "11.5px",
                          color: "var(--muted2)",
                          transition: "color 0.15s",
                          "&:hover": { color: "var(--accent)" },
                        }}
                      >
                        {t(entry.labelKey)}
                      </Box>
                    </Link>
                  ),
                )}
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      <BackToTopButton />
    </Box>
  );
};
