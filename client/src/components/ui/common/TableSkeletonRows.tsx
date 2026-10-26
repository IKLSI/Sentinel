import type React from "react";
import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import {
  chipWidthAt,
  skeletonRowIds,
  subtitleWidthAt,
  titleWidthAt,
} from "@/components/ui/common/skeletonShapes";

export type SkeletonCell =
  | "title"
  | "avatar"
  | "chip"
  | "text"
  | "count"
  | "empty";

interface Props {
  cells: readonly SkeletonCell[];
  rows?: number;
  cellPadding?: string;
}

const TitleLines: React.FC<{ position: number }> = ({ position }) => (
  <Box
    sx={{
      flex: 1,
      minWidth: 0,
      display: "flex",
      flexDirection: "column",
      gap: "6px",
    }}
  >
    <Skeleton variant="rounded" width={titleWidthAt(position)} height={13} />
    <Skeleton variant="rounded" width={subtitleWidthAt(position)} height={10} />
  </Box>
);

const CellShape: React.FC<{ cell: SkeletonCell; position: number }> = ({
  cell,
  position,
}) => {
  switch (cell) {
    case "title":
      return <TitleLines position={position} />;
    case "avatar":
      return (
        <Box sx={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Skeleton
            variant="circular"
            width={28}
            height={28}
            sx={{ flexShrink: 0 }}
          />
          <TitleLines position={position} />
        </Box>
      );
    case "chip":
      return (
        <Skeleton
          variant="rounded"
          width={chipWidthAt(position)}
          height={20}
          sx={{ borderRadius: "999px" }}
        />
      );
    case "text":
      return (
        <Skeleton
          variant="rounded"
          width={titleWidthAt(position + 1)}
          height={12}
        />
      );
    case "count":
      return (
        <Skeleton
          variant="rounded"
          width={24}
          height={12}
          sx={{ mx: "auto" }}
        />
      );
    case "empty":
      return null;
  }
};

export const TableSkeletonRows: React.FC<Props> = ({
  cells,
  rows = 6,
  cellPadding = "11px 16px",
}) => {
  const columns = cells.map((cell, offset) => ({
    cell,
    offset,
    id: `column-${offset}`,
  }));

  return skeletonRowIds(rows).map(({ id, position }) => (
    <Box component="tr" key={id}>
      {columns.map((column) => (
        <Box
          component="td"
          key={column.id}
          sx={{
            padding: cellPadding,
            height: 36,
            borderBottom: "1px solid var(--border)",
            verticalAlign: "middle",
          }}
        >
          <CellShape cell={column.cell} position={position + column.offset} />
        </Box>
      ))}
    </Box>
  ));
};
