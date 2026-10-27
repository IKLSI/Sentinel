import type React from "react";
import Box from "@mui/material/Box";
import { useI18n } from "@/contexts/I18nContext";
import { SEVERITY_TONES } from "@/constants/severities";
import type {
  ParkOverview,
  VulnerabilityFlowPoint,
} from "@/domains/dashboard/types";
import { DependencyDonut } from "@/features/dashboard/pages/DashboardPage/components/ParkHero/components/DependencyDonut";
import { RiskTile } from "@/features/dashboard/pages/DashboardPage/components/ParkHero/components/RiskTile";
import {
  GAUGE_BAND_GAP,
  GAUGE_BANDS,
  GAUGE_SIZE,
  GAUGE_THICKNESS,
} from "@/features/dashboard/pages/DashboardPage/constants";
import {
  arcPath,
  arcPoint,
  flowSeries,
  formatDelta,
} from "@/features/dashboard/pages/DashboardPage/helpers";
import { pluralKey } from "@/helpers/plural";

interface Props {
  overview: ParkOverview;
  vulnerabilityFlow: VulnerabilityFlowPoint[];
}

const GAUGE_CENTER = GAUGE_SIZE / 2;
const GAUGE_RADIUS = (GAUGE_SIZE - GAUGE_THICKNESS) / 2;
const GAUGE_MARKER_RADIUS = GAUGE_THICKNESS / 2 + 3;

export const ParkHero: React.FC<Props> = ({ overview, vulnerabilityFlow }) => {
  const { t } = useI18n();
  const { vulnerabilities } = overview;
  const delta = formatDelta(t, overview.scoreDelta);
  const score = overview.averageScore ?? null;
  const marker =
    score === null
      ? null
      : arcPoint(GAUGE_CENTER, GAUGE_CENTER, GAUGE_RADIUS, score);

  const eolHint =
    overview.nextRuntimeEolInDays === null ||
    overview.nextRuntimeEolInDays === undefined
      ? t("dashboard.hero.eol_hint_none")
      : overview.nextRuntimeEolInDays <= 0
        ? t("dashboard.hero.eol_hint_overdue")
        : t("dashboard.hero.eol_hint", {
            days: overview.nextRuntimeEolInDays,
          });

  return (
    <Box
      component="section"
      aria-label={t("dashboard.hero.label")}
      sx={{
        borderRadius: "var(--r-lg)",
        background: "var(--s1)",
        border: "1px solid var(--border)",
        color: "var(--text)",
        boxShadow: "var(--sh-1)",
        p: { xs: "18px", md: "16px 26px" },
        display: "grid",
        gridTemplateColumns: { xs: "1fr", lg: "220px minmax(0, 1fr) 270px" },
        gap: { xs: "18px", lg: "28px" },
        alignItems: "center",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <Box sx={{ position: "relative", width: GAUGE_SIZE, maxWidth: "100%" }}>
          <svg
            viewBox={`0 0 ${GAUGE_SIZE} ${GAUGE_CENTER + GAUGE_THICKNESS}`}
            width="100%"
            role="img"
            aria-label={t("dashboard.hero.gauge_label", {
              score: overview.averageScore ?? "–",
            })}
          >
            {GAUGE_BANDS.map((band) => (
              <path
                key={band.from}
                d={arcPath(
                  GAUGE_CENTER,
                  GAUGE_CENTER,
                  GAUGE_RADIUS,
                  band.from + GAUGE_BAND_GAP,
                  band.to - GAUGE_BAND_GAP,
                )}
                fill="none"
                stroke={band.color}
                strokeWidth={GAUGE_THICKNESS}
                opacity={score === null ? 0.25 : 1}
              />
            ))}
            {marker && (
              <circle
                cx={marker.x}
                cy={marker.y}
                r={GAUGE_MARKER_RADIUS}
                fill="var(--text)"
                stroke="var(--s1)"
                strokeWidth={4}
              />
            )}
          </svg>
          <Box
            sx={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: "6px",
              textAlign: "center",
              fontSize: "48px",
              fontWeight: 800,
              letterSpacing: "-0.045em",
              lineHeight: 1,
              color: "var(--text)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {score ?? "–"}
          </Box>
        </Box>
        <Box sx={{ fontSize: "13px", color: "var(--muted2)", mt: "8px" }}>
          {overview.grade ? (
            <>
              {t("dashboard.hero.grade_prefix")}{" "}
              <Box component="b" sx={{ color: "var(--teal)", fontWeight: 700 }}>
                {overview.grade}
              </Box>
              {delta && `, ${delta}`}
            </>
          ) : (
            t("dashboard.hero.score_unavailable")
          )}
        </Box>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
          gap: "12px",
        }}
      >
        <RiskTile
          value={vulnerabilities.critical}
          color={SEVERITY_TONES.Critical}
          label={t(
            pluralKey("dashboard.hero.critical", vulnerabilities.critical),
          )}
          hint={
            vulnerabilities.knownExploited > 0
              ? t(
                  pluralKey(
                    "dashboard.hero.exploited_hint",
                    vulnerabilities.knownExploited,
                  ),
                  { count: vulnerabilities.knownExploited },
                )
              : t("dashboard.hero.exploited_hint_none")
          }
        />
        <RiskTile
          value={vulnerabilities.high}
          color={SEVERITY_TONES.High}
          trend={flowSeries(vulnerabilityFlow, "detected")}
          label={t(pluralKey("dashboard.hero.high", vulnerabilities.high))}
          hint={t(
            pluralKey("dashboard.hero.total_hint", vulnerabilities.total),
            {
              count: vulnerabilities.total,
            },
          )}
        />
        <RiskTile
          value={overview.runtimesEndingSoon}
          color="var(--purple)"
          label={t(
            pluralKey("dashboard.hero.eol", overview.runtimesEndingSoon),
          )}
          hint={eolHint}
        />
        <RiskTile
          value={overview.majorUpdatesInProduction}
          color="var(--yellow)"
          label={t(
            pluralKey(
              "dashboard.hero.major",
              overview.majorUpdatesInProduction,
            ),
          )}
          hint={t("dashboard.hero.major_hint")}
        />
      </Box>

      <DependencyDonut dependencies={overview.dependencies} />
    </Box>
  );
};
