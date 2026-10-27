import type React from "react";
import Box from "@mui/material/Box";
import { AppTooltip } from "@/components/ui/common/AppTooltip";
import { useI18n } from "@/contexts/I18nContext";
import { SEVERITY_TONES } from "@/constants/severities";

interface Props {
  criticalVulnerabilityCount: number;
  highVulnerabilityCount: number;
  eolRuntimeCount: number;
}

export const BreakdownBars: React.FC<Props> = ({
  criticalVulnerabilityCount,
  highVulnerabilityCount,
  eolRuntimeCount,
}) => {
  const { t } = useI18n();

  const axes = [
    {
      key: "critical",
      count: criticalVulnerabilityCount,
      color: SEVERITY_TONES.Critical,
    },
    { key: "high", count: highVulnerabilityCount, color: SEVERITY_TONES.High },
    { key: "runtimes", count: eolRuntimeCount, color: "var(--purple)" },
  ].map((axis) => ({
    ...axis,
    color: axis.count > 0 ? axis.color : "var(--border)",
  }));

  return (
    <AppTooltip
      title={
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "8px 1fr auto",
            alignItems: "center",
            gap: "4px 8px",
            fontSize: "11px",
          }}
        >
          {axes.map((axis) => (
            <Box key={axis.key} sx={{ display: "contents" }}>
              <Box
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: axis.color,
                }}
              />
              <span>{t(`dashboard.axis.${axis.key}`)}</span>
              <Box
                component="b"
                sx={{ fontVariantNumeric: "tabular-nums", textAlign: "right" }}
              >
                {axis.count}
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
              background: axis.color,
            }}
          />
        ))}
      </Box>
    </AppTooltip>
  );
};
