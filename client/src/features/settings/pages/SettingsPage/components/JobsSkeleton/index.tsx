import type React from "react";
import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import { LoadingRegion } from "@/components/ui/common/LoadingRegion";
import { titleWidthAt } from "@/components/ui/common/skeletonShapes";
import { useT } from "@/contexts/I18nContext";

const CARDS = [0, 1, 2];
const SCHEDULE = ["last", "next"];

export const JobsSkeleton: React.FC = () => {
  const t = useT();

  return (
    <LoadingRegion label={t("settings.jobs.loading")}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "16px",
        }}
      >
        {CARDS.map((position) => (
          <Box
            key={position}
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              p: "20px",
              background: "var(--s1)",
              border: "1px solid var(--border)",
              borderRadius: "var(--r-lg)",
            }}
          >
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
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                background: "var(--s2)",
                border: "1px solid var(--border)",
                borderRadius: "var(--r-md)",
              }}
            >
              {SCHEDULE.map((slot) => (
                <Box
                  key={slot}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "6px",
                    p: "12px 10px",
                    "& + &": { borderLeft: "1px solid var(--border)" },
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
