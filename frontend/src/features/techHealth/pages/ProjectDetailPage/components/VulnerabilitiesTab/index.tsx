import type React from "react";
import { memo, useRef } from "react";
import Box from "@mui/material/Box";
import CheckCircleOutlined from "@mui/icons-material/CheckCircleOutlined";
import { VirtualRowSpacer } from "@/components/ui/common/VirtualRowSpacer";
import { useT } from "@/contexts/I18nContext";
import { useVirtualRows } from "@/hooks/useVirtualRows";
import type { Vulnerability } from "@/domains/projects/types";
import type { VulnerabilitySeverity } from "@/enums";
import {
  SEV_CONFIG,
  TD,
  TH,
} from "@/features/techHealth/pages/ProjectDetailPage/helpers";

type VulnWithDep = Vulnerability & { dependencyName: string };

const ESTIMATED_ROW_HEIGHT = 44;
const OVERSCAN = 10;
const COLUMN_COUNT = 5;

const rowSx = { "& td": { borderBottom: "1px solid var(--border)" } } as const;

interface RowProps {
  vuln: VulnWithDep;
  index: number;
  measureRef: (el: HTMLElement | null) => void;
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
          {vuln.cveId}
        </Box>
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
  const scrollRef = useRef<HTMLDivElement>(null);

  const { virtualizer, items, paddingTop, paddingBottom } = useVirtualRows({
    count: vulns.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: ESTIMATED_ROW_HEIGHT,
    overscan: OVERSCAN,
  });

  if (vulns.length === 0) {
    return (
      <Box className="empty-state">
        <CheckCircleOutlined
          className="empty-state-icon"
          sx={{ fontSize: 40 }}
        />
        <Box className="empty-state-title">
          {t("tech_health.empty.no_vulns_title")}
        </Box>
        <Box className="empty-state-subtitle">
          {t("tech_health.empty.no_vulns_subtitle")}
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
            <Box component="col" sx={{ width: "6%" }} />
            <Box component="col" sx={{ width: "18%" }} />
            <Box component="col" sx={{ width: "34%" }} />
            <Box component="col" sx={{ width: "13%" }} />
            <Box component="col" sx={{ width: "12%" }} />
          </Box>
          <Box component="thead">
            <Box component="tr">
              <TH>{t("tech_health.table.vuln.score")}</TH>
              <TH>{t("tech_health.table.vuln.dependency")}</TH>
              <TH>{t("tech_health.table.vuln.vulnerability")}</TH>
              <TH>{t("tech_health.table.vuln.cve_ref")}</TH>
              <TH>{t("tech_health.table.vuln.fixed_version")}</TH>
            </Box>
          </Box>
        </Box>
      </Box>
      <Box ref={scrollRef} sx={{ overflowY: "auto", flex: 1 }}>
        <Box
          component="table"
          sx={{
            width: "100%",
            borderCollapse: "collapse",
            tableLayout: "fixed",
          }}
        >
          <Box component="colgroup">
            <Box component="col" sx={{ width: "6%" }} />
            <Box component="col" sx={{ width: "18%" }} />
            <Box component="col" sx={{ width: "34%" }} />
            <Box component="col" sx={{ width: "13%" }} />
            <Box component="col" sx={{ width: "12%" }} />
          </Box>
          <Box component="tbody">
            <VirtualRowSpacer height={paddingTop} columnCount={COLUMN_COUNT} />
            {items.map((item) => {
              const v = vulns[item.index];
              return (
                <VulnRow
                  key={v.id}
                  vuln={v}
                  index={item.index}
                  measureRef={virtualizer.measureElement}
                />
              );
            })}
            <VirtualRowSpacer
              height={paddingBottom}
              columnCount={COLUMN_COUNT}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
