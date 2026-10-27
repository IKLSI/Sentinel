import { memo } from "react";
import Box from "@mui/material/Box";
import { AppTooltip } from "@/components/ui/common/AppTooltip";
import { StatusChip } from "@/components/ui/common/StatusChip";
import { TruncatedText } from "@/components/ui/common/TruncatedText";
import { TD, TR } from "@/components/ui/common/table/VirtualTable/TableCells";
import { useT } from "@/contexts/I18nContext";
import type { Runtime } from "@/domains/projects/types";
import { FindingKind } from "@/enums";
import { formatDate } from "@/formatters/date";
import {
  EOL_COLOR,
  RUNTIME_STATUS,
} from "@/features/projects/pages/ProjectDetailPage/constants";
import {
  getDaysLabel,
  getRuntimeProgress,
  getRuntimeUrgency,
} from "@/features/projects/pages/ProjectDetailPage/helpers";
import { FindingTicketCell } from "@/features/projects/pages/ProjectDetailPage/components/FindingTicketCell";

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

interface Props {
  runtime: Runtime;
  index: number;
  locale: string;
}

export const RuntimeRow = memo<Props>(({ runtime, index, locale }) => {
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
