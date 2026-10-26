import type React from "react";
import Box from "@mui/material/Box";
import { useI18n } from "@/contexts/I18nContext";
import { SEVERITY_TONES } from "@/constants/severities";
import type {
  ParkOverview,
  VulnerabilityFlowPoint,
} from "@/domains/dashboard/types";
import { DependencyDonut } from "@/features/dashboard/pages/DashboardPage/components/DependencyDonut";
import { RiskTile } from "@/features/dashboard/pages/DashboardPage/components/RiskTile";
import { ScoreGauge } from "@/features/dashboard/pages/DashboardPage/components/ScoreGauge";
import {
  flowSeries,
  formatDelta,
  pluralKey,
} from "@/features/dashboard/pages/DashboardPage/helpers";

interface Props {
  overview: ParkOverview;
  vulnerabilityFlow: VulnerabilityFlowPoint[];
}

export const ParkHero: React.FC<Props> = ({ overview, vulnerabilityFlow }) => {
  const { t } = useI18n();
  const { vulnerabilities } = overview;
  const delta = formatDelta(t, overview.scoreDelta);

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
        <ScoreGauge
          score={overview.averageScore ?? null}
          label={t("dashboard.hero.gauge_label", {
            score: overview.averageScore ?? "–",
          })}
        />
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
