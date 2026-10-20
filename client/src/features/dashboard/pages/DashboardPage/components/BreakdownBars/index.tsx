import type React from "react";
import Box from "@mui/material/Box";
import { AppTooltip } from "@/components/ui/common/AppTooltip";
import { useI18n } from "@/contexts/I18nContext";
import type { ProjectHealth } from "@/domains/dashboard/types";
import { gradeMeta } from "@/features/dashboard/pages/DashboardPage/helpers";

interface Props {
  breakdown: NonNullable<ProjectHealth["breakdown"]>;
}

export const BreakdownBars: React.FC<Props> = ({ breakdown }) => {
  const { t } = useI18n();

  const axes = [
    {
      key: "security",
      value: breakdown.security,
      grade: breakdown.securityGrade,
    },
    {
      key: "runtimes",
      value: breakdown.runtimes,
      grade: breakdown.runtimesGrade,
    },
    {
      key: "freshness",
      value: breakdown.freshness,
      grade: breakdown.freshnessGrade,
    },
  ];

  return (
    <AppTooltip
      title={
        <Box sx={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {axes.map((axis) => (
            <Box
              key={axis.key}
              sx={{
                display: "grid",
                gridTemplateColumns: "8px 1fr auto auto",
                alignItems: "center",
                gap: "8px",
                fontSize: "11px",
              }}
            >
              <Box
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: gradeMeta(axis.grade).color,
                }}
              />
              <span>{t(`dashboard.axis.${axis.key}`)}</span>
              <Box component="b" sx={{ fontVariantNumeric: "tabular-nums" }}>
                {axis.value}
              </Box>
              <Box component="span" sx={{ opacity: 0.7, minWidth: 10 }}>
                {axis.grade}
              </Box>
            </Box>
          ))}
        </Box>
      }
    >
      <Box sx={{ display: "flex", gap: "2px", width: 36, mt: "5px" }}>
        {axes.map((axis) => (
          <Box
            key={axis.key}
            sx={{
              flex: 1,
              height: 3,
              borderRadius: "2px",
              background: gradeMeta(axis.grade).color,
            }}
          />
        ))}
      </Box>
    </AppTooltip>
  );
};
