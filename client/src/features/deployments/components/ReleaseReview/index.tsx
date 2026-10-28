import type React from "react";
import Box from "@mui/material/Box";
import type { ReleaseComparison } from "@/domains/deployments/types";
import { DependenciesPanel } from "@/features/deployments/components/DependenciesPanel";
import { ReleaseChecksPanel } from "@/features/deployments/components/ReleaseChecksPanel";
import { ReleaseNotesPanel } from "@/features/deployments/components/ReleaseNotesPanel";
import { REVIEW_GRID_COLUMNS } from "@/features/deployments/constants";

interface Props {
  comparison: ReleaseComparison;
}

export const ReleaseReview: React.FC<Props> = ({ comparison }) => (
  <Box
    sx={{
      flex: 1,
      minHeight: { xs: "auto", lg: 0 },
      display: "grid",
      gridTemplateColumns: REVIEW_GRID_COLUMNS,
      gridTemplateRows: { lg: "minmax(0, 1fr)" },
      gap: "16px",
    }}
  >
    <ReleaseChecksPanel comparison={comparison} />
    <DependenciesPanel comparison={comparison} />
    <ReleaseNotesPanel comparison={comparison} />
  </Box>
);
