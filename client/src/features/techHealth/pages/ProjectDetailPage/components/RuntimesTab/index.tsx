import type React from "react";
import Box from "@mui/material/Box";
import StorageOutlined from "@mui/icons-material/StorageOutlined";
import { EmptyState } from "@/components/ui/common/EmptyState";
import { TD, TR } from "@/components/ui/common/VirtualTable/TableCells";
import {
  VirtualTable,
  type VirtualTableColumn,
} from "@/components/ui/common/VirtualTable";
import { useT } from "@/contexts/I18nContext";
import { RuntimeEolStatus } from "@/enums";
import type { Runtime } from "@/domains/projects/types";
import {
  EMPTY_STATE_SX,
  EOL_COLOR,
  getDaysLabel,
  getRuntimeUrgency,
} from "@/features/techHealth/pages/ProjectDetailPage/helpers";

const ESTIMATED_ROW_HEIGHT = 44;

const nameSx = {
  display: "block",
  fontFamily: "var(--font-mono)",
  fontSize: "11px",
  fontWeight: 600,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
} as const;
const versionSx = {
  fontFamily: "var(--font-mono)",
  fontSize: "11px",
} as const;
const otherVersionsSx = {
  fontFamily: "var(--font-mono)",
  fontSize: "10px",
  color: "var(--muted2)",
  marginLeft: "6px",
} as const;

const RuntimeRow: React.FC<{ runtime: Runtime }> = ({ runtime: r }) => {
  const t = useT();
  const urgency = getRuntimeUrgency(r);
  const uc = EOL_COLOR[urgency];
  const daysLabel = getDaysLabel(r, t);
  const otherVersions = r.versions.filter((version) => version !== r.version);

  return (
    <TR accent={uc.stripe}>
      <TD>
        <Box component="span" sx={nameSx}>
          {r.name}
        </Box>
      </TD>
      <TD muted>
        <Box component="span" sx={versionSx}>
          {r.version}
        </Box>
        {otherVersions.length > 0 && (
          <Box component="span" sx={otherVersionsSx}>
            {`+ ${otherVersions.join(" · ")}`}
          </Box>
        )}
      </TD>
      <TD>
        <Box
          component="span"
          sx={{
            fontSize: "11px",
            color: uc.text,
            fontWeight:
              urgency === RuntimeEolStatus.Ok ||
              urgency === RuntimeEolStatus.Unknown
                ? 400
                : 600,
          }}
        >
          {daysLabel}
        </Box>
      </TD>
    </TR>
  );
};

interface Props {
  runtimes: Runtime[];
}

export const RuntimesTab: React.FC<Props> = ({ runtimes }) => {
  const t = useT();

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
    { label: t("tech_health.table.runtime.runtime"), width: "auto" },
    { label: t("tech_health.table.runtime.version"), width: "12%" },
    { label: t("tech_health.table.runtime.eol"), width: "15%" },
  ];

  return (
    <VirtualTable<Runtime>
      rows={runtimes}
      getRowId={(r) => r.id}
      columns={columns}
      estimateRowHeight={ESTIMATED_ROW_HEIGHT}
      renderRow={(r) => <RuntimeRow key={r.id} runtime={r} />}
    />
  );
};
