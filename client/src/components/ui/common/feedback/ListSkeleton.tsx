import type React from "react";
import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import {
  chipWidthAt,
  skeletonRowIds,
  subtitleWidthAt,
  titleWidthAt,
} from "@/components/ui/common/feedback/skeletonShapes";

interface Props {
  rows?: number;
  rowHeight?: number;
}

export const ListSkeleton: React.FC<Props> = ({ rows = 6, rowHeight = 56 }) => (
  <Box sx={{ display: "flex", flexDirection: "column" }}>
    {skeletonRowIds(rows).map(({ id, position }) => (
      <Box
        key={id}
        sx={{
          height: rowHeight,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: "12px",
          px: "14px",
          borderBottom: "1px solid var(--border)",
          "&:last-of-type": { borderBottom: "none" },
        }}
      >
        <Skeleton
          variant="rounded"
          width={28}
          height={28}
          sx={{ flexShrink: 0 }}
        />
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            gap: "6px",
          }}
        >
          <Skeleton
            variant="rounded"
            width={titleWidthAt(position)}
            height={12}
          />
          <Skeleton
            variant="rounded"
            width={subtitleWidthAt(position)}
            height={10}
          />
        </Box>
        <Skeleton
          variant="rounded"
          width={chipWidthAt(position)}
          height={20}
          sx={{ flexShrink: 0, borderRadius: "999px" }}
        />
      </Box>
    ))}
  </Box>
);
