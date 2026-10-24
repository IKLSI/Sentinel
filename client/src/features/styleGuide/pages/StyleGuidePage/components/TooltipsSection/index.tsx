import type React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { AppTooltip } from "@/components/ui/common/AppTooltip";
import { TruncatedText } from "@/components/ui/common/TruncatedText";
import { useT } from "@/contexts/I18nContext";
import { ChartTooltip } from "@/features/dashboard/pages/DashboardPage/components/ChartTooltip";
import { Section } from "@/features/styleGuide/pages/StyleGuidePage/components/Section";
import { SubLabel } from "@/features/styleGuide/pages/StyleGuidePage/components/SubLabel";

const PLACEMENTS = ["top", "right", "bottom", "left"] as const;

const CHART_PAYLOAD = [{ dataKey: "score", value: 82, color: "var(--accent)" }];

export const TooltipsSection: React.FC = () => {
  const t = useT();

  return (
    <Section
      title={t("style_guide.section.tooltips")}
      desc={t("style_guide.section.tooltips_desc")}
    >
      <SubLabel>AppTooltip</SubLabel>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: "10px", mb: "24px" }}>
        {PLACEMENTS.map((placement) => (
          <AppTooltip
            key={placement}
            title={t("style_guide.tooltip.sample")}
            placement={placement}
          >
            <Button variant="contained" color="inherit">
              {placement}
            </Button>
          </AppTooltip>
        ))}
      </Box>

      <SubLabel>TruncatedText</SubLabel>
      <Box
        sx={{
          width: 180,
          mb: "24px",
          fontSize: "13px",
          color: "var(--text)",
        }}
      >
        <TruncatedText
          text={t("style_guide.tooltip.truncated")}
          fontSize="13px"
        />
      </Box>

      <SubLabel>ChartTooltip</SubLabel>
      <Box sx={{ display: "inline-block" }}>
        <ChartTooltip
          active
          label="22 oct."
          payload={CHART_PAYLOAD}
          labels={{ score: "/ 100" }}
        />
      </Box>
    </Section>
  );
};
