import { memo } from "react";
import Box from "@mui/material/Box";
import { StatusChip } from "@/components/ui/common/StatusChip";
import { TruncatedText } from "@/components/ui/common/TruncatedText";
import { TD, TR } from "@/components/ui/common/table/VirtualTable/TableCells";
import { AppTooltip } from "@/components/ui/common/AppTooltip";
import { useT } from "@/contexts/I18nContext";
import type { Dependency } from "@/domains/projects/types";
import { FindingKind } from "@/enums";
import { DEPENDENCY_TYPE_PROD } from "@/features/projects/pages/ProjectDetailPage/filters";
import { statusOf } from "@/features/projects/pages/ProjectDetailPage/components/DependenciesTab/helpers";
import { FindingTicketCell } from "@/features/projects/pages/ProjectDetailPage/components/FindingTicketCell";
import { NO_VALUE } from "@/constants/display";

const ecosystemSx = {
  fontFamily: "var(--font-mono)",
  fontSize: "11px",
  color: "var(--muted2)",
  background: "var(--s3)",
  px: "7px",
  py: "2px",
  borderRadius: "var(--r-xs)",
} as const;

const versionSx = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  fontFamily: "var(--font-mono)",
  fontSize: "11px",
} as const;

const latestVersionSx = { color: "var(--orange)", fontWeight: 600 } as const;

const vulnCountSx = {
  fontFamily: "var(--font-mono)",
  fontSize: "11px",
  fontWeight: 700,
  color: "var(--red)",
} as const;

const manifestPathSx = {
  fontFamily: "var(--font-mono)",
  fontSize: "10px",
  color: "var(--muted)",
  minWidth: 0,
} as const;

const mutedSx = { color: "var(--muted)" } as const;

interface Props {
  dependency: Dependency;
  index: number;
}

export const DependencyRow = memo<Props>(({ dependency, index }) => {
  const t = useT();
  const status = statusOf(dependency);
  const vulnCount = dependency.vulnerabilities.length;

  return (
    <TR index={index}>
      <TD>
        <TruncatedText mono strong text={dependency.name} />
        {dependency.manifestPath && (
          <Box sx={manifestPathSx}>
            <TruncatedText text={dependency.manifestPath} />
          </Box>
        )}
      </TD>
      <TD>
        <Box component="span" sx={ecosystemSx}>
          {dependency.ecosystem}
        </Box>
      </TD>
      <TD>
        <StatusChip variant="gray">
          {t(
            dependency.type === DEPENDENCY_TYPE_PROD
              ? "tech_health.dep.type_prod"
              : "tech_health.dep.type_dev",
          )}
        </StatusChip>
      </TD>
      <TD>
        <StatusChip variant="gray">
          {t(
            dependency.isDirect
              ? "tech_health.dep.relation_direct"
              : "tech_health.dep.relation_transitive",
          )}
        </StatusChip>
      </TD>
      <TD muted>
        <Box sx={versionSx}>
          {dependency.isVersionPinned ? (
            <span>{dependency.currentVersion}</span>
          ) : (
            <AppTooltip title={t("tech_health.version.range_hint")}>
              <span>{`≥ ${dependency.currentVersion}`}</span>
            </AppTooltip>
          )}
          {dependency.latestVersion &&
            dependency.latestVersion !== dependency.currentVersion && (
              <>
                <Box component="span" sx={mutedSx}>
                  →
                </Box>
                <Box component="span" sx={latestVersionSx}>
                  {dependency.latestVersion}
                </Box>
              </>
            )}
        </Box>
      </TD>
      <TD>
        <StatusChip variant={status.variant}>{t(status.labelKey)}</StatusChip>
      </TD>
      <TD align="center">
        {vulnCount > 0 ? (
          <Box component="span" sx={vulnCountSx}>
            {vulnCount}
          </Box>
        ) : (
          <Box component="span" sx={mutedSx}>
            {NO_VALUE}
          </Box>
        )}
      </TD>
      <TD align="center">
        <FindingTicketCell
          kind={FindingKind.OutdatedDependency}
          findingKey={dependency.findingKey}
          linkedTicket={dependency.linkedTicket}
          actionable={dependency.isOutdated}
        />
      </TD>
    </TR>
  );
});
DependencyRow.displayName = "DependencyRow";
