import type React from "react";
import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import { keyframes } from "@mui/material/styles";

interface Props {
  rows?: number;
  rowHeight?: number;
}

const pulse = keyframes`
  0%, 100% { opacity: 0.55; }
  50% { opacity: 1; }
`;

export const ListSkeleton: React.FC<Props> = ({ rows = 6, rowHeight = 56 }) => {
  const rowIds = Array.from(
    { length: rows },
    (_, position) => `row-${position}`,
  );

  return (
    <Box
      aria-busy="true"
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        flex: 1,
        animation: `${pulse} 1.6s ease-in-out infinite`,
      }}
    >
      {rowIds.map((id) => (
        <Skeleton
          key={id}
          variant="rounded"
          height={rowHeight}
          animation={false}
          sx={{ flexShrink: 0 }}
        />
      ))}
    </Box>
  );
};
