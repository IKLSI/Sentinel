import type React from "react";
import { memo } from "react";
import Box from "@mui/material/Box";
import CheckCircleOutlined from "@mui/icons-material/CheckCircleOutlined";
import { AppTooltip } from "@/components/ui/common/AppTooltip";
import { EmptyState } from "@/components/ui/common/EmptyState";
import { TD } from "@/components/ui/common/VirtualTable/TableCells";
import {
  VirtualTable,
  type VirtualTableColumn,
} from "@/components/ui/common/VirtualTable";
import { useT } from "@/contexts/I18nContext";
import type { Vulnerability } from "@/domains/projects/types";
import type { VulnerabilitySeverity } from "@/enums";
import {
  EMPTY_STATE_SX,
  SEV_CONFIG,
} from "@/features/techHealth/pages/ProjectDetailPage/helpers";

type VulnWithDep = Vulnerability & { dependencyName: string };

const ESTIMATED_ROW_HEIGHT = 44;

const rowSx = { "& td": { borderBottom: "1px solid var(--border)" } } as const;

interface RowProps {
  vuln: VulnWithDep;
  index: number;
  measureRef?: (el: HTMLElement | null) => void;
}

const VulnRow = memo<RowProps>(({ vuln, index, measureRef }) => {
  const cfg =
    SEV_CONFIG[vuln.severity as VulnerabilitySeverity] ?? SEV_CONFIG.Low;
  return (
    <Box component="tr" ref={measureRef} data-index={index} sx={rowSx}>
      <TD>
        <Box
          component="span"
          sx={{
            fontFamily: "var(--font-mono)",
            fontSize: "13px",
            fontWeight: 700,
            color: cfg.color,
          }}
        >
          {vuln.cvssScore > 0 ? vuln.cvssScore.toFixed(1) : "—"}
        </Box>
      </TD>
      <TD>
        <Box
          component="span"
          sx={{
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            color: "var(--muted2)",
          }}
        >
          {vuln.dependencyName}
        </Box>
      </TD>
      <TD>{vuln.description}</TD>
      <TD>
        <AppTooltip title={vuln.cveAlias ? vuln.cveId : ""}>
          <Box
            component="span"
            sx={{
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              color: "var(--cyan)",
              background: "var(--cyan-subtle)",
              px: "7px",
              py: "3px",
              borderRadius: "var(--r-xs)",
            }}
          >
            {vuln.cveAlias ?? vuln.cveId}
          </Box>
        </AppTooltip>
      </TD>
      <TD>
        {vuln.fixedVersion ? (
          <Box
            component="span"
            sx={{
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
              color: "var(--muted2)",
            }}
          >
            {vuln.fixedVersion}
          </Box>
        ) : (
          <Box
            component="span"
            sx={{ color: "var(--muted)", fontSize: "12px" }}
          >
            —
          </Box>
        )}
      </TD>
    </Box>
  );
});
VulnRow.displayName = "VulnRow";

interface Props {
  vulns: VulnWithDep[];
}

export const VulnerabilitiesTab: React.FC<Props> = ({ vulns }) => {
  const t = useT();

  if (vulns.length === 0) {
    return (
      <EmptyState
        icon={CheckCircleOutlined}
        title={t("tech_health.empty.no_vulns_title")}
        subtitle={t("tech_health.empty.no_vulns_subtitle")}
        iconSize={40}
        sx={EMPTY_STATE_SX}
      />
    );
  }

  const columns: VirtualTableColumn[] = [
    { label: t("tech_health.table.vuln.score"), width: "6%" },
    { label: t("tech_health.table.vuln.dependency"), width: "18%" },
    { label: t("tech_health.table.vuln.vulnerability"), width: "34%" },
    { label: t("tech_health.table.vuln.cve_ref"), width: "13%" },
    { label: t("tech_health.table.vuln.fixed_version"), width: "12%" },
  ];

  return (
    <VirtualTable<VulnWithDep>
      rows={vulns}
      getRowId={(v) => v.id}
      columns={columns}
      estimateRowHeight={ESTIMATED_ROW_HEIGHT}
      measureRows
      renderRow={(v, index, measureRef) => (
        <VulnRow key={v.id} vuln={v} index={index} measureRef={measureRef} />
      )}
    />
  );
};
