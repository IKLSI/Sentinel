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
import type { Runtime } from "@/domains/projects/types";
import {
  EOL_COLOR,
  getDaysLabel,
  getRuntimeUrgency,
} from "@/features/techHealth/pages/ProjectDetailPage/helpers";

const ESTIMATED_ROW_HEIGHT = 44;

const RuntimeRow: React.FC<{ runtime: Runtime }> = ({ runtime: r }) => {
  const t = useT();
  const urgency = getRuntimeUrgency(r);
  const uc = EOL_COLOR[urgency];
  const daysLabel = getDaysLabel(r, t);

  return (
    <TR accent={uc.stripe}>
      <TD>
        <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <StorageOutlined
            sx={{ fontSize: 13, color: "var(--muted)", flexShrink: 0 }}
          />
          <Box component="span" sx={{ fontSize: "13px", fontWeight: 600 }}>
            {r.name}
          </Box>
        </Box>
      </TD>
      <TD mono muted>
        {r.version}
      </TD>
      <TD>
        <Box
          component="span"
          sx={{
            fontSize: "12px",
            color: uc.text,
            fontWeight: urgency !== "ok" ? 600 : 400,
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
