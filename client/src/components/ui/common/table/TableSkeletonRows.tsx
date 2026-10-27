import type React from "react";
import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import TableCell from "@mui/material/TableCell";
import TableRow from "@mui/material/TableRow";
import {
  chipWidthAt,
  skeletonRowIds,
  subtitleWidthAt,
  titleWidthAt,
} from "@/components/ui/common/feedback/skeletonShapes";

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
  size?: "small" | "medium";
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
  size = "medium",
}) => {
  const columns = cells.map((cell, offset) => ({
    cell,
    offset,
    id: `column-${offset}`,
  }));

  return skeletonRowIds(rows).map(({ id, position }) => (
    <TableRow key={id}>
      {columns.map((column) => (
        <TableCell key={column.id} size={size} sx={{ height: 36 }}>
          <CellShape cell={column.cell} position={position + column.offset} />
        </TableCell>
      ))}
    </TableRow>
  ));
};
