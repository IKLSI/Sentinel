import type React from "react";
import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";

export const ProjectDetailSkeleton: React.FC = () => (
  <Box sx={{ p: "36px 28px 24px" }}>
    <Box
      sx={{
        background: "var(--s1)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r)",
        mb: "16px",
        p: "20px 24px",
      }}
    >
      <Skeleton variant="text" width={200} height={28} sx={{ mb: "8px" }} />
      <Skeleton variant="text" width={320} height={16} sx={{ mb: "16px" }} />
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          borderTop: "1px solid var(--border)",
          pt: "16px",
        }}
      >
        {[0, 1, 2, 3].map((i) => (
          <Box key={i} sx={{ px: "20px" }}>
            <Skeleton variant="text" width={80} height={14} />
            <Skeleton variant="text" width={50} height={36} />
          </Box>
        ))}
      </Box>
    </Box>
    <Box
      sx={{
        display: "flex",
        gap: "20px",
        borderBottom: "1px solid var(--border)",
        pb: "11px",
        mb: "20px",
      }}
    >
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} variant="text" width={110} height={16} />
      ))}
    </Box>
    <Box
      sx={{
        background: "var(--s1)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r)",
        overflow: "hidden",
      }}
    >
      <Skeleton variant="rectangular" height={48} sx={{ mb: 0 }} />
      {[0, 1, 2, 3, 4].map((i) => (
        <Skeleton
          key={i}
          variant="rectangular"
          height={52}
          sx={{ mt: "1px" }}
        />
      ))}
    </Box>
  </Box>
);
