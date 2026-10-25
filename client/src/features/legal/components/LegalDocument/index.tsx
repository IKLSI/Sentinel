import type React from "react";
import { useCallback, useMemo } from "react";
import Box from "@mui/material/Box";
import MailOutlineOutlined from "@mui/icons-material/MailOutlineOutlined";
import { Link } from "@tanstack/react-router";
import { ROUTES } from "@/constants/routes";
import { SentinelWordmark } from "@/components/layout/SentinelWordmark";
import { useT } from "@/contexts/I18nContext";
import { useAppConfigQuery } from "@/domains/settings/queries";
import { BackToTopButton } from "@/features/legal/components/BackToTopButton";
import { LegalSectionCard } from "@/features/legal/components/LegalSectionCard";
import { LegalSummary } from "@/features/legal/components/LegalSummary";
import {
  LEGAL_DOCUMENTS,
  LEGAL_HEADER_HEIGHT,
  LEGAL_SCROLL_OFFSET,
} from "@/features/legal/constants";
import type { LegalSection } from "@/features/legal/types";
import { useActiveSection } from "@/hooks/useActiveSection";
import { useToast } from "@/hooks/useToast";

interface Props {
  documentId: string;
  titleKey: string;
  subtitleKey: string;
  updatedKey: string;
  sections: LegalSection[];
}

const CONTENT_SX = {
  maxWidth: 1140,
  mx: "auto",
  px: { xs: "18px", md: "28px" },
} as const;

export const LegalDocument: React.FC<Props> = ({
  documentId,
  titleKey,
  subtitleKey,
  updatedKey,
  sections,
}) => {
  const t = useT();
  const { showToast } = useToast();
  const supportEmail = useAppConfigQuery().data?.supportEmail ?? "";
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
      <Box
        component="header"
        className="legal-no-print"
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          borderBottom: "1px solid var(--border)",
          background: "color-mix(in srgb, var(--bg) 86%, transparent)",
          backdropFilter: "blur(14px)",
        }}
      >
        <Box
          sx={{
            ...CONTENT_SX,
            height: `${LEGAL_HEADER_HEIGHT}px`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
          }}
        >
          <Link
            to={ROUTES.HOME}
            aria-label={t("legal.shell.back_home")}
            style={{
              display: "flex",
              alignItems: "center",
              color: "var(--text)",
            }}
          >
            <SentinelWordmark height={18} />
          </Link>

          <Box
            sx={{
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--muted)",
              whiteSpace: "nowrap",
            }}
          >
            {t("legal.shell.eyebrow")}
          </Box>
        </Box>
      </Box>

      <Box
        sx={{
          ...CONTENT_SX,
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
          {t(titleKey)}
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
          {t(subtitleKey)}
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
            {t("legal.shell.updated", { date: t(updatedKey) })}
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
          <LegalSummary sections={sections} activeId={activeId} />

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
                  section={section}
                  index={index}
                  onCopyAnchor={copyAnchor}
                />
              ))}
            </Box>

            <Box
              sx={{
                mt: "20px",
                p: { xs: "18px", md: "22px 24px" },
                border: "1px solid var(--border)",
                borderRadius: "var(--r-md)",
                background:
                  "linear-gradient(135deg, var(--s2) 0%, var(--s1) 100%)",
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "14px",
              }}
            >
              <Box>
                <Box sx={{ fontSize: "13px", fontWeight: 600 }}>
                  {t("legal.shell.contact_title")}
                </Box>
                <Box
                  sx={{
                    mt: "5px",
                    whiteSpace: { md: "nowrap" },
                    fontSize: "12px",
                    lineHeight: 1.65,
                    color: "var(--muted2)",
                  }}
                >
                  {t("legal.shell.contact_body")}
                </Box>
              </Box>
              {supportEmail && (
                <Box
                  component="a"
                  href={`mailto:${supportEmail}`}
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    fontFamily: "var(--font-mono)",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "var(--accent)",
                    textDecoration: "none",
                    border: "1px solid var(--accent-border)",
                    background: "var(--accent-subtle)",
                    borderRadius: "var(--r-sm)",
                    px: "12px",
                    py: "8px",
                    whiteSpace: "nowrap",
                    transition: "background 0.15s",
                    "&:hover": {
                      background:
                        "color-mix(in srgb, var(--accent) 16%, transparent)",
                    },
                  }}
                >
                  <MailOutlineOutlined sx={{ fontSize: 14 }} />
                  {supportEmail}
                </Box>
              )}
            </Box>

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
