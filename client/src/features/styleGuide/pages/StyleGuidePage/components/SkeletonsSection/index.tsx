import type React from "react";
import Box from "@mui/material/Box";
import FolderOutlined from "@mui/icons-material/FolderOutlined";
import { useT } from "@/contexts/I18nContext";
import { EmptyState } from "@/components/ui/common/feedback/EmptyState";
import { ListSkeleton } from "@/components/ui/common/feedback/ListSkeleton";
import { LoadingRegion } from "@/components/ui/common/feedback/LoadingRegion";
import { ChartCardSkeleton } from "@/features/dashboard/pages/DashboardPage/components/ChartCardSkeleton";
import { Section } from "@/features/styleGuide/pages/StyleGuidePage/components/Section";
import { SubLabel } from "@/features/styleGuide/pages/StyleGuidePage/components/SubLabel";
import { PANEL_SX } from "@/helpers/cardSx";

export const SkeletonsSection: React.FC = () => {
  const t = useT();

  return (
    <Section
      title={t("style_guide.section.skeletons")}
      desc={t("style_guide.section.skeletons_desc")}
    >
      <SubLabel>{t("style_guide.skeletons.list")}</SubLabel>
      <Box
        sx={{
          mb: "24px",
          ...PANEL_SX,
          overflow: "hidden",
        }}
      >
        <LoadingRegion label={t("projects.loading")}>
          <ListSkeleton rows={4} />
        </LoadingRegion>
      </Box>

      <SubLabel>{t("style_guide.skeletons.charts")}</SubLabel>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "16px",
          mb: "24px",
        }}
      >
        <ChartCardSkeleton title={t("dashboard.trend.title")} variant="trend" />
        <ChartCardSkeleton title={t("dashboard.flow.title")} variant="flow" />
      </Box>

      <SubLabel>{t("style_guide.skeletons.empty")}</SubLabel>
      <EmptyState
        icon={FolderOutlined}
        title={t("style_guide.skeletons.empty_title")}
        subtitle={t("style_guide.skeletons.empty_subtitle")}
      />
    </Section>
  );
};
