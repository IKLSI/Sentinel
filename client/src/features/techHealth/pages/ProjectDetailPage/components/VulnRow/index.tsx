import { memo } from "react";
import Box from "@mui/material/Box";
import LocalFireDepartmentOutlined from "@mui/icons-material/LocalFireDepartmentOutlined";
import { AppTooltip } from "@/components/ui/common/AppTooltip";
import { TruncatedText } from "@/components/ui/common/TruncatedText";
import { TD, TR } from "@/components/ui/common/VirtualTable/TableCells";
import { NO_VALUE } from "@/constants/display";
import { type Translate, useT } from "@/contexts/I18nContext";
import { FindingKind, type VulnerabilitySeverity } from "@/enums";
import {
  SEVERITY_REASON_LABEL_KEYS,
  riskConfigOf,
} from "@/features/techHealth/pages/ProjectDetailPage/helpers";
import {
  DEPENDENCY_TYPE_PROD,
  type VulnerabilityRow,
} from "@/features/techHealth/pages/ProjectDetailPage/filters";
import { FindingTicketCell } from "@/features/techHealth/pages/ProjectDetailPage/components/FindingTicketCell";
import { SuppressionCell } from "@/features/techHealth/pages/ProjectDetailPage/components/SuppressionCell";

const referenceSx = {
  fontFamily: "var(--font-mono)",
  fontSize: "10px",
  color: "var(--cyan)",
  background: "var(--cyan-subtle)",
  px: "7px",
  py: "3px",
  borderRadius: "var(--r-xs)",
  textDecoration: "none",
  whiteSpace: "nowrap",
  "&:hover": { textDecoration: "underline" },
} as const;

const secondaryReferenceSx = {
  fontFamily: "var(--font-mono)",
  fontSize: "10px",
  color: "var(--muted)",
  textDecoration: "none",
  "&:hover": { color: "var(--cyan)", textDecoration: "underline" },
} as const;

const scoreSx = {
  fontFamily: "var(--font-mono)",
  fontSize: "11px",
  color: "var(--text)",
} as const;

const OSV_VULNERABILITY_URL = "https://osv.dev/vulnerability/";

const NVD_VULNERABILITY_URL = "https://nvd.nist.gov/vuln/detail/";

const isCve = (identifier: string | null): identifier is string =>
  identifier?.toUpperCase().startsWith("CVE-") ?? false;

const RISK_LEVELS = [1, 2, 3, 4] as const;

const formatPercent = (value: number) => `${Math.round(value * 100)} %`;

const severityReason = (vuln: VulnerabilityRow, t: Translate) =>
  t(
    SEVERITY_REASON_LABEL_KEYS[vuln.severity as VulnerabilitySeverity] ??
      SEVERITY_REASON_LABEL_KEYS.Low,
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

const referencesSx = { display: "flex", alignItems: "center", gap: "6px" };

const riskBarStyle = (level: number, filledColor: string | null) => ({
  width: 3,
  height: 4 + level * 3,
  borderRadius: 1,
  background: filledColor ?? "var(--border2)",
});

export const VulnRow = memo<{
  vuln: VulnerabilityRow;
  projectId: string;
  index: number;
}>(({ vuln, projectId, index }) => {
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
            href={
              isCve(vuln.cveAlias)
                ? `${NVD_VULNERABILITY_URL}${encodeURIComponent(vuln.cveAlias)}`
                : `${OSV_VULNERABILITY_URL}${encodeURIComponent(vuln.cveId)}`
            }
            target="_blank"
            rel="noopener noreferrer"
            sx={referenceSx}
          >
            {vuln.cveAlias ?? vuln.cveId}
          </Box>
          {vuln.cveAlias && (
            <AppTooltip title={vuln.cveId}>
              <Box
                component="a"
                href={`${OSV_VULNERABILITY_URL}${encodeURIComponent(vuln.cveId)}`}
                target="_blank"
                rel="noopener noreferrer"
                sx={secondaryReferenceSx}
              >
                OSV
              </Box>
            </AppTooltip>
          )}
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
          projectId={projectId}
          findingKey={vuln.findingKey}
          vulnerabilityLabel={vuln.cveAlias ?? vuln.cveId}
          suppression={vuln.suppression}
        />
      </TD>
    </TR>
  );
});
VulnRow.displayName = "VulnRow";
