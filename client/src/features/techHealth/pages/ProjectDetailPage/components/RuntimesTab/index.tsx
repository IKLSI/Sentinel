import type React from "react";
import { memo, useMemo } from "react";
import Box from "@mui/material/Box";
import StorageOutlined from "@mui/icons-material/StorageOutlined";
import { AppTooltip } from "@/components/ui/common/AppTooltip";
import { EmptyState } from "@/components/ui/common/EmptyState";
import { StatusChip } from "@/components/ui/common/StatusChip";
import { TruncatedText } from "@/components/ui/common/TruncatedText";
import { TD, TR } from "@/components/ui/common/VirtualTable/TableCells";
import type { VirtualTableColumn } from "@/components/ui/common/VirtualTable";
import { useI18n, useT } from "@/contexts/I18nContext";
import type { Runtime } from "@/domains/projects/types";
import { FindingKind } from "@/enums";
import { formatDate } from "@/formatters/date";
import { useGridControls } from "@/hooks/useGridControls";
import {
  EMPTY_STATE_SX,
  EOL_COLOR,
  RUNTIME_STATUS,
  getDaysLabel,
  getRuntimeDaysRemaining,
  getRuntimeProgress,
  getRuntimeUrgency,
} from "@/features/techHealth/pages/ProjectDetailPage/helpers";
import { buildRuntimeFilterFields } from "@/features/techHealth/pages/ProjectDetailPage/filters";
import { FindingGrid } from "@/features/techHealth/pages/ProjectDetailPage/components/FindingGrid";
import { FindingTicketCell } from "@/features/techHealth/pages/ProjectDetailPage/components/FindingTicketCell";

const COLUMN_KEYS = {
  runtime: "runtime",
  version: "version",
  status: "status",
  deadline: "deadline",
  eolDate: "eolDate",
  ticket: "ticket",
} as const;

const DEFAULT_SORT = { key: COLUMN_KEYS.deadline, direction: "asc" } as const;

const NEVER_ASSESSED_RANK = Number.MAX_SAFE_INTEGER;

const daysRank = (runtime: Runtime) =>
  getRuntimeDaysRemaining(runtime) ?? NEVER_ASSESSED_RANK;

const comparators = {
  [COLUMN_KEYS.runtime]: (a: Runtime, b: Runtime) =>
    a.name.localeCompare(b.name),
  [COLUMN_KEYS.status]: (a: Runtime, b: Runtime) =>
    RUNTIME_STATUS[getRuntimeUrgency(a)].weight -
    RUNTIME_STATUS[getRuntimeUrgency(b)].weight,
  [COLUMN_KEYS.deadline]: (a: Runtime, b: Runtime) => daysRank(a) - daysRank(b),
};

const searchableValues = (runtime: Runtime) => [
  runtime.name,
  runtime.version,
  ...runtime.versions,
];

const versionSx = { fontFamily: "var(--font-mono)", fontSize: "11px" } as const;

const otherVersionsSx = {
  fontFamily: "var(--font-mono)",
  fontSize: "10px",
  color: "var(--muted2)",
  marginLeft: "6px",
} as const;

const deadlineSx = {
  display: "flex",
  alignItems: "center",
  gap: "14px",
} as const;

const meterSx = {
  position: "relative",
  flex: 1,
  minWidth: "40px",
  height: "4px",
  borderRadius: "2px",
  background: "var(--s3)",
  overflow: "hidden",
} as const;

const meterFillStyle = {
  position: "absolute",
  inset: "0 auto 0 0",
  borderRadius: 2,
} as const;

const daysLabelSx = {
  fontFamily: "var(--font-mono)",
  fontSize: "11px",
  whiteSpace: "nowrap",
} as const;

const RuntimeRow = memo<{
  runtime: Runtime;
  index: number;
  locale: string;
}>(({ runtime, index, locale }) => {
  const t = useT();
  const urgency = getRuntimeUrgency(runtime);
  const colors = EOL_COLOR[urgency];
  const status = RUNTIME_STATUS[urgency];
  const otherVersions = runtime.versions.filter(
    (version) => version !== runtime.version,
  );

  return (
    <TR index={index}>
      <TD>
        <TruncatedText mono strong text={runtime.name} />
      </TD>
      <TD muted>
        {runtime.isMinimumConstraint ? (
          <AppTooltip title={t("tech_health.runtime.minimum_hint")}>
            <Box component="span" sx={versionSx}>
              {`≥ ${runtime.version}`}
            </Box>
          </AppTooltip>
        ) : (
          <Box component="span" sx={versionSx}>
            {runtime.version}
          </Box>
        )}
        {otherVersions.length > 0 && (
          <Box component="span" sx={otherVersionsSx}>
            {`+ ${otherVersions.join(" · ")}`}
          </Box>
        )}
      </TD>
      <TD>
        <StatusChip variant={status.variant}>{t(status.labelKey)}</StatusChip>
      </TD>
      <TD>
        <Box sx={deadlineSx}>
          <Box sx={meterSx}>
            <span
              style={{
                ...meterFillStyle,
                width: `${getRuntimeProgress(runtime)}%`,
                background: colors.stripe,
              }}
            />
          </Box>
          <Box component="span" sx={daysLabelSx} style={{ color: colors.text }}>
            {getDaysLabel(runtime, t)}
          </Box>
        </Box>
      </TD>
      <TD mono muted align="right">
        {formatDate(runtime.eolDate, locale)}
      </TD>
      <TD align="center">
        <FindingTicketCell
          kind={FindingKind.EolRuntime}
          findingKey={runtime.findingKey}
          linkedTicket={runtime.linkedTicket}
          actionable={runtime.isEol === true && !runtime.isMinimumConstraint}
        />
      </TD>
    </TR>
  );
});
RuntimeRow.displayName = "RuntimeRow";

interface Props {
  runtimes: Runtime[];
}

export const RuntimesTab: React.FC<Props> = ({ runtimes }) => {
  const t = useT();
  const { culture } = useI18n();

  const fields = useMemo(() => buildRuntimeFilterFields(t), [t]);

  const controls = useGridControls<Runtime>({
    rows: runtimes,
    searchableValues,
    fields,
    comparators,
    defaultSort: DEFAULT_SORT,
  });

  if (runtimes.length === 0) {
    return (
      <EmptyState
        icon={StorageOutlined}
        title={t("tech_health.empty.no_runtimes_title")}
        subtitle={t("tech_health.empty.no_runtimes_subtitle")}
        iconSize={40}
        sx={EMPTY_STATE_SX}
      />
    );
  }

  const columns: VirtualTableColumn[] = [
    {
      key: COLUMN_KEYS.runtime,
      label: t("tech_health.table.runtime.runtime"),
      width: "22%",
      sortable: true,
    },
    {
      key: COLUMN_KEYS.version,
      label: t("tech_health.table.runtime.version"),
      width: "20%",
    },
    {
      key: COLUMN_KEYS.status,
      label: t("tech_health.table.dep.status"),
      width: "14%",
      sortable: true,
    },
    {
      key: COLUMN_KEYS.deadline,
      label: t("tech_health.table.runtime.deadline"),
      width: "20%",
      sortable: true,
    },
    {
      key: COLUMN_KEYS.eolDate,
      label: t("tech_health.table.runtime.eol"),
      width: "14%",
      align: "right",
    },
    {
      key: COLUMN_KEYS.ticket,
      label: t("tech_health.table.ticket"),
      width: "10%",
      align: "center",
    },
  ];

  return (
    <FindingGrid<Runtime>
      controls={controls}
      fields={fields}
      columns={columns}
      getRowId={(runtime) => runtime.id}
      countKeys={{
        singular: "tech_health.count.runtimes_singular",
        plural: "tech_health.count.runtimes_plural",
      }}
      renderRow={(runtime, index) => (
        <RuntimeRow
          key={runtime.id}
          runtime={runtime}
          index={index}
          locale={culture}
        />
      )}
    />
  );
};
