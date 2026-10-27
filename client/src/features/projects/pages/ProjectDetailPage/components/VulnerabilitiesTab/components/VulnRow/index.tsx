import { memo } from "react";
import Box from "@mui/material/Box";
import LocalFireDepartmentOutlined from "@mui/icons-material/LocalFireDepartmentOutlined";
import { AppTooltip } from "@/components/ui/common/AppTooltip";
import { TruncatedText } from "@/components/ui/common/TruncatedText";
import { TD, TR } from "@/components/ui/common/table/VirtualTable/TableCells";
import { NO_VALUE } from "@/constants/display";
import { type Translate, useT } from "@/contexts/I18nContext";
import { FindingKind } from "@/enums";
import { SEVERITY_REASON_LABEL_KEYS } from "@/features/projects/pages/ProjectDetailPage/constants";
import {
  formatPercent,
  riskConfigOf,
  vulnerabilityReferenceUrl,
} from "@/features/projects/pages/ProjectDetailPage/helpers";
import {
  DEPENDENCY_TYPE_PROD,
  type VulnerabilityRow,
} from "@/features/projects/pages/ProjectDetailPage/filters";
import { FindingTicketCell } from "@/features/projects/pages/ProjectDetailPage/components/FindingTicketCell";
import { SuppressionCell } from "@/features/projects/pages/ProjectDetailPage/components/VulnerabilitiesTab/components/VulnRow/components/SuppressionCell";

const referenceSx = {
  fontFamily: "var(--font-mono)",
  fontSize: "10px",
  color: "var(--cyan)",
  background: "var(--cyan-subtle)",
  px: "7px",
  py: "3px",
  borderRadius: "var(--r-xs)",
  textDecoration: "underline",
  whiteSpace: "nowrap",
} as const;

const scoreSx = {
  fontFamily: "var(--font-mono)",
  fontSize: "11px",
  color: "var(--text)",
} as const;

const referencesSx = { display: "flex", alignItems: "center", gap: "6px" };

const RISK_LEVELS = [1, 2, 3, 4] as const;

const severityReason = (vuln: VulnerabilityRow, t: Translate) =>
  t(
    SEVERITY_REASON_LABEL_KEYS[vuln.severity] ?? SEVERITY_REASON_LABEL_KEYS.Low,
  );

const riskDetails = (vuln: VulnerabilityRow, t: Translate) =>
  [
    vuln.isMaliciousPackage && t("tech_health.risk.malicious_package"),
    vuln.isKnownExploited && t("tech_health.risk.known_exploited"),
    !vuln.isMaliciousPackage &&
      `${severityReason(vuln, t)}${
        vuln.cvssScore > 0
          ? ` (${t("tech_health.risk.cvss", { score: vuln.cvssScore.toFixed(1) })})`
          : ""
      }`,
    vuln.epssScore != null &&
      t("tech_health.risk.exploitation_probability", {
        value: formatPercent(vuln.epssScore),
      }),
    vuln.dependencyType !== DEPENDENCY_TYPE_PROD &&
      t("tech_health.risk.dev_dependency"),
  ].filter(Boolean);

const tooltipLinesSx = {
  display: "flex",
  flexDirection: "column",
  gap: "3px",
} as const;

const riskCellSx = {
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
} as const;

const riskBarsSx = {
  display: "inline-flex",
  alignItems: "flex-end",
  gap: "2px",
} as const;

const riskLabelSx = {
  fontSize: "12px",
  color: "var(--text)",
  whiteSpace: "nowrap",
} as const;

const knownExploitedIconSx = { fontSize: 14, color: "var(--red)" } as const;

const riskBarStyle = (level: number, filledColor: string | null) => ({
  width: 3,
  height: 4 + level * 3,
  borderRadius: 1,
  background: filledColor ?? "var(--border2)",
});

export const VulnRow = memo<{
  vuln: VulnerabilityRow;
  index: number;
}>(({ vuln, index }) => {
  const t = useT();
  const riskConfig = riskConfigOf(vuln);

  return (
    <TR index={index}>
      <TD>
        <AppTooltip
          title={
            <Box sx={tooltipLinesSx}>
              {riskDetails(vuln, t).map((line) => (
                <span key={String(line)}>{line}</span>
              ))}
            </Box>
          }
        >
          <Box component="span" sx={riskCellSx}>
            <Box component="span" aria-hidden sx={riskBarsSx}>
              {RISK_LEVELS.map((level) => (
                <span
                  key={level}
                  style={riskBarStyle(
                    level,
                    level <= riskConfig.weight ? riskConfig.color : null,
                  )}
                />
              ))}
            </Box>
            <Box component="span" sx={riskLabelSx}>
              {t(riskConfig.labelKey)}
            </Box>
            {vuln.isKnownExploited && (
              <LocalFireDepartmentOutlined sx={knownExploitedIconSx} />
            )}
          </Box>
        </AppTooltip>
      </TD>
      <TD>
        <TruncatedText mono strong text={vuln.dependencyName} />
      </TD>
      <TD>
        <TruncatedText text={vuln.description} />
      </TD>
      <TD align="center">
        <Box component="span" sx={scoreSx}>
          {vuln.cvssScore > 0 ? vuln.cvssScore.toFixed(1) : NO_VALUE}
        </Box>
      </TD>
      <TD align="center">
        <Box component="span" sx={scoreSx}>
          {vuln.epssScore != null ? formatPercent(vuln.epssScore) : NO_VALUE}
        </Box>
      </TD>
      <TD>
        <Box sx={referencesSx}>
          <Box
            component="a"
            href={vulnerabilityReferenceUrl(vuln)}
            target="_blank"
            rel="noopener noreferrer"
            sx={referenceSx}
          >
            {vuln.cveAlias ?? vuln.cveId}
          </Box>
        </Box>
      </TD>
      <TD mono muted>
        {vuln.fixedVersion ?? NO_VALUE}
      </TD>
      <TD align="center">
        <FindingTicketCell
          kind={FindingKind.Vulnerability}
          findingKey={vuln.findingKey}
          linkedTicket={vuln.linkedTicket}
          actionable
        />
      </TD>
      <TD align="center">
        <SuppressionCell
          findingKey={vuln.findingKey}
          vulnerabilityLabel={vuln.cveAlias ?? vuln.cveId}
          suppression={vuln.suppression}
        />
      </TD>
    </TR>
  );
});
VulnRow.displayName = "VulnRow";
