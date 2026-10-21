import type React from "react";
import Box from "@mui/material/Box";
import { useI18n } from "@/contexts/I18nContext";
import {
  SHOWCASE,
  SHOWCASE_REPORT_AXES,
  SHOWCASE_VULNERABILITIES,
} from "@/features/landing/constants";
import {
  formatShortDate,
  landingGradeColorOf,
} from "@/features/landing/helpers";
import { DeliverableCard } from "@/features/landing/pages/LandingPage/components/DeliverableCard";
import { LandingSection } from "@/features/landing/pages/LandingPage/components/LandingSection";
import { SectionIntro } from "@/features/landing/pages/LandingPage/components/SectionIntro";

const TITLE_ID = "landing-deliverables-title";

const cardSx = {
  width: "100%",
  boxSizing: "border-box",
  background: "#ffffff",
  borderRadius: "14px",
  boxShadow: "0 0 0 1px var(--line), 0 12px 30px -16px rgba(16,17,36,.18)",
  fontSize: "13px",
} as const;

const titleSx = { m: 0, fontSize: "14.5px", fontWeight: 600 } as const;

const tagSx = {
  fontSize: "12px",
  px: "10px",
  py: "3px",
  borderRadius: "999px",
  background: "var(--tint)",
  color: "var(--ink-2)",
} as const;

export const Deliverables: React.FC = () => {
  const { t, culture } = useI18n();

  return (
    <LandingSection labelledBy={TITLE_ID}>
      <SectionIntro
        titleId={TITLE_ID}
        title={t("landing.deliverables.title")}
        description={t("landing.deliverables.subtitle")}
      />
      <Box
        sx={{
          display: "grid",
          gap: "28px",
          gridTemplateColumns: "1fr",
          "@media (min-width:860px)": {
            gridTemplateColumns: "repeat(3, 1fr)",
          },
        }}
      >
        <DeliverableCard
          title={t("landing.deliverables.alert.title")}
          description={t("landing.deliverables.alert.desc")}
        >
          <Box sx={{ ...cardSx, p: "12px 14px" }}>
            <Box sx={{ fontSize: "11.5px", color: "var(--ink-3)", mb: "4px" }}>
              {t("landing.deliverables.mail.from")}
            </Box>
            <Box
              component="p"
              sx={{ ...titleSx, fontSize: "13px", lineHeight: 1.3, mb: "6px" }}
            >
              {t("landing.deliverables.mail.subject", {
                count: SHOWCASE_VULNERABILITIES.length,
                project: SHOWCASE.onlineStore,
              })}
            </Box>
            {SHOWCASE_VULNERABILITIES.map(
              ({ packageName, cve, fixedVersion, severityKey, color }) => (
                <Box
                  key={packageName}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    gap: "1px 10px",
                    py: "7px",
                    borderTop: "1px solid var(--line)",
                  }}
                >
                  <Box
                    component="b"
                    sx={{ fontWeight: 500, fontSize: "12.5px", minWidth: 0 }}
                  >
                    <Box
                      component="i"
                      sx={{
                        display: "inline-block",
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        mr: "6px",
                        verticalAlign: "1px",
                        background: color,
                      }}
                    />
                    {packageName}
                  </Box>
                  <Box
                    component="span"
                    sx={{
                      gridColumn: 1,
                      fontSize: "11.5px",
                      color: "var(--ink-3)",
                    }}
                  >
                    {t(severityKey, { cve })}
                  </Box>
                  <Box
                    component="em"
                    sx={{
                      gridRow: "1 / 3",
                      gridColumn: 2,
                      alignSelf: "center",
                      fontStyle: "normal",
                      fontSize: "11.5px",
                      fontWeight: 600,
                      color: "#15803d",
                      background: "#eaf7ef",
                      px: "8px",
                      py: "2px",
                      borderRadius: "999px",
                    }}
                  >
                    {fixedVersion}
                  </Box>
                </Box>
              ),
            )}
          </Box>
        </DeliverableCard>

        <DeliverableCard
          title={t("landing.deliverables.ticket.title")}
          description={t("landing.deliverables.ticket.desc")}
        >
          <Box sx={{ ...cardSx, p: "16px", display: "grid", gap: "12px" }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "12px",
                color: "var(--ink-3)",
              }}
            >
              <span>{SHOWCASE.mailTicket}</span>
              <span>{t("landing.deliverables.ticket.age")}</span>
            </Box>
            <Box component="p" sx={{ ...titleSx, lineHeight: 1.35 }}>
              {t("landing.deliverables.ticket.subject", {
                package: SHOWCASE_VULNERABILITIES[0].packageName,
                version: SHOWCASE_VULNERABILITIES[0].fixedVersion,
              })}
            </Box>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              <Box
                component="span"
                sx={{
                  ...tagSx,
                  background: "#fdecec",
                  color: "#b91c1c",
                  fontWeight: 500,
                }}
              >
                {t("landing.deliverables.ticket.critical")}
              </Box>
              <Box component="span" sx={tagSx}>
                {t("landing.deliverables.ticket.security")}
              </Box>
              <Box component="span" sx={tagSx}>
                {SHOWCASE.onlineStore}
              </Box>
            </Box>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "12.5px",
                color: "var(--ink-2)",
                pt: "10px",
                borderTop: "1px solid var(--line)",
              }}
            >
              <Box
                component="i"
                sx={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: "#c7c4ff",
                }}
              />
              {t("landing.deliverables.ticket.assignee", {
                name: SHOWCASE.assignee,
              })}
            </Box>
          </Box>
        </DeliverableCard>

        <DeliverableCard
          title={t("landing.deliverables.proof.title")}
          description={t("landing.deliverables.proof.desc")}
        >
          <Box
            sx={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: "10px",
            }}
          >
            <Box sx={{ ...cardSx, p: "14px 16px" }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  pb: "10px",
                  mb: "10px",
                  borderBottom: "1px solid var(--line)",
                }}
              >
                <Box
                  component="span"
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: "10px",
                    display: "grid",
                    placeItems: "center",
                    color: "#ffffff",
                    fontWeight: 600,
                    fontSize: "17px",
                    background: landingGradeColorOf(SHOWCASE.stepGrade),
                  }}
                >
                  {SHOWCASE.stepGrade}
                </Box>
                <Box>
                  <Box
                    component="b"
                    sx={{ display: "block", fontSize: "13.5px" }}
                  >
                    {t("landing.deliverables.report.title")}
                  </Box>
                  <Box
                    component="span"
                    sx={{ fontSize: "12px", color: "var(--ink-3)" }}
                  >
                    {t("landing.deliverables.report.meta", {
                      project: SHOWCASE.customerPortal,
                      date: formatShortDate(SHOWCASE.reportDate, culture),
                    })}
                  </Box>
                </Box>
              </Box>
              <Box
                sx={{
                  display: "grid",
                  gap: "6px",
                  fontSize: "12px",
                  color: "var(--ink-2)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {SHOWCASE_REPORT_AXES.map((axis) => (
                  <Box
                    key={axis.labelKey}
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "64px 1fr 22px",
                      gap: "8px",
                      alignItems: "center",
                    }}
                  >
                    {t(axis.labelKey)}
                    <Box
                      component="i"
                      sx={{
                        height: 5,
                        borderRadius: "5px",
                        background: "var(--tint)",
                        overflow: "hidden",
                      }}
                    >
                      <Box
                        component="span"
                        sx={{
                          display: "block",
                          height: "100%",
                          width: `${axis.value}%`,
                          borderRadius: "5px",
                          background:
                            "color" in axis ? axis.color : "var(--grade-a)",
                        }}
                      />
                    </Box>
                    {axis.value}
                  </Box>
                ))}
              </Box>
            </Box>
            <Box
              sx={{
                ...cardSx,
                display: "flex",
                alignItems: "center",
                gap: "12px",
                p: "12px 14px",
              }}
            >
              <Box
                component="span"
                aria-hidden
                sx={{
                  width: 36,
                  height: 36,
                  flex: "none",
                  borderRadius: "10px",
                  display: "grid",
                  placeItems: "center",
                  background: "var(--indigo-soft)",
                  color: "var(--indigo)",
                }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
                  <path d="M14 3v5h5" />
                  <path d="M9 13h6M9 17h4" />
                </svg>
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box
                  component="b"
                  sx={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {SHOWCASE.sbomFile}
                </Box>
                <Box
                  component="small"
                  sx={{ fontSize: "12px", color: "var(--ink-3)" }}
                >
                  {t("landing.deliverables.sbom.meta", {
                    count: SHOWCASE.sbomComponents,
                  })}
                </Box>
              </Box>
              <Box
                component="span"
                aria-hidden
                sx={{
                  width: 30,
                  height: 30,
                  flex: "none",
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  background: "var(--ink)",
                  color: "#ffffff",
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
                </svg>
              </Box>
            </Box>
          </Box>
        </DeliverableCard>
      </Box>
    </LandingSection>
  );
};
