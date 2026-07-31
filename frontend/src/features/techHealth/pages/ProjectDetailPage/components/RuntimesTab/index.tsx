import type React from "react";
import Box from "@mui/material/Box";
import StorageOutlined from "@mui/icons-material/StorageOutlined";
import { useT } from "@/contexts/I18nContext";
import type { Runtime } from "@/domains/projects/types";
import {
  EOL_COLOR,
  TD,
  TH,
  TR,
  getDaysLabel,
  getRuntimeUrgency,
} from "@/features/techHealth/pages/ProjectDetailPage/helpers";

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
      <Box className="empty-state">
        <StorageOutlined className="empty-state-icon" sx={{ fontSize: 40 }} />
        <Box className="empty-state-title">
          {t("tech_health.empty.no_runtimes_title")}
        </Box>
        <Box className="empty-state-subtitle">
          {t("tech_health.empty.no_runtimes_subtitle")}
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        border: "1px solid var(--border)",
        borderRadius: "var(--r)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box sx={{ flexShrink: 0 }}>
        <Box
          component="table"
          sx={{
            width: "100%",
            borderCollapse: "collapse",
            tableLayout: "fixed",
          }}
        >
          <Box component="colgroup">
            <Box component="col" />
            <Box component="col" sx={{ width: "12%" }} />
            <Box component="col" sx={{ width: "15%" }} />
          </Box>
          <Box component="thead">
            <Box component="tr">
              <TH>{t("tech_health.table.runtime.runtime")}</TH>
              <TH>{t("tech_health.table.runtime.version")}</TH>
              <TH>{t("tech_health.table.runtime.eol")}</TH>
            </Box>
          </Box>
        </Box>
      </Box>
      <Box sx={{ overflowY: "auto", flex: 1 }}>
        <Box
          component="table"
          sx={{
            width: "100%",
            borderCollapse: "collapse",
            tableLayout: "fixed",
          }}
        >
          <Box component="colgroup">
            <Box component="col" />
            <Box component="col" sx={{ width: "12%" }} />
            <Box component="col" sx={{ width: "15%" }} />
          </Box>
          <Box component="tbody">
            {runtimes.map((r) => (
              <RuntimeRow key={r.id} runtime={r} />
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
