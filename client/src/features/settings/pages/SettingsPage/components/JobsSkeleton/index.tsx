import type React from "react";
import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import { LoadingRegion } from "@/components/ui/common/LoadingRegion";
import { titleWidthAt } from "@/components/ui/common/skeletonShapes";
import { useT } from "@/contexts/I18nContext";
import {
  JOBS_GRID_SX,
  JOB_CARD_SX,
  JOB_SCHEDULE_SLOT_SX,
  JOB_SCHEDULE_SX,
} from "@/features/settings/pages/SettingsPage/constants";

const CARDS = [0, 1, 2];
const SCHEDULE = ["last", "next"];

export const JobsSkeleton: React.FC = () => {
  const t = useT();

  return (
    <LoadingRegion label={t("settings.jobs.loading")}>
      <Box sx={JOBS_GRID_SX}>
        {CARDS.map((position) => (
          <Box key={position} sx={JOB_CARD_SX}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <Skeleton
                variant="rounded"
                width={titleWidthAt(position)}
                height={16}
              />
              <Skeleton
                variant="rounded"
                width={72}
                height={20}
                sx={{ borderRadius: "999px" }}
              />
            </Box>
            <Box sx={JOB_SCHEDULE_SX}>
              {SCHEDULE.map((slot) => (
                <Box
                  key={slot}
                  sx={{
                    ...JOB_SCHEDULE_SLOT_SX,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <Skeleton variant="rounded" width={64} height={10} />
                  <Skeleton variant="rounded" width={96} height={13} />
                </Box>
              ))}
            </Box>
          </Box>
        ))}
      </Box>
    </LoadingRegion>
  );
};
