import type React from "react";
import Box from "@mui/material/Box";
import { ListSkeleton } from "@/components/ui/common/feedback/ListSkeleton";
import { LoadingRegion } from "@/components/ui/common/feedback/LoadingRegion";
import { useT } from "@/contexts/I18nContext";
import { REVIEW_GRID_COLUMNS } from "@/features/deployments/constants";
import { CARD_SX } from "@/helpers/cardSx";

const SKELETON_PANELS = ["checks", "dependencies", "notes"] as const;

export const DeploymentSkeleton: React.FC = () => {
  const t = useT();

  return (
    <LoadingRegion label={t("deployments.loading")}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: REVIEW_GRID_COLUMNS,
          gap: "16px",
        }}
      >
        {SKELETON_PANELS.map((panel) => (
          <Box key={panel} sx={CARD_SX}>
            <ListSkeleton rows={6} rowHeight={42} />
          </Box>
        ))}
      </Box>
    </LoadingRegion>
  );
};
