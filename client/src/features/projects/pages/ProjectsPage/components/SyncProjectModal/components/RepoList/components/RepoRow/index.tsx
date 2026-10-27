import { memo } from "react";
import Box from "@mui/material/Box";
import CheckOutlined from "@mui/icons-material/CheckOutlined";
import type { AvailableRepo } from "@/domains/projects/types";
import { TEXT_ELLIPSIS_SX } from "@/constants/display";

interface Props {
  repo: AvailableRepo;
  isSelected: boolean;
  onToggle: (url: string) => void;
}

export const RepoRow = memo(({ repo, isSelected, onToggle }: Props) => (
  <Box
    onClick={() => onToggle(repo.url)}
    onMouseDown={(e) => e.preventDefault()}
    sx={{
      display: "flex",
      alignItems: "center",
      gap: "11px",
      px: "10px",
      py: "9px",
      borderRadius: "var(--r)",
      background: isSelected ? "var(--accent-subtle)" : "transparent",
      cursor: "pointer",
      userSelect: "none",
      "&:hover": {
        background: isSelected
          ? "color-mix(in srgb, var(--accent) 11%, transparent)"
          : "var(--s2)",
      },
      transition: "background 0.1s",
    }}
  >
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Box
        sx={{
          fontSize: "13px",
          fontWeight: isSelected ? 600 : 500,
          color: "var(--text)",
          ...TEXT_ELLIPSIS_SX,
        }}
      >
        {repo.name}
      </Box>
      <Box
        sx={{
          mt: "2px",
          fontSize: "11.5px",
          color: "var(--muted2)",
          ...TEXT_ELLIPSIS_SX,
        }}
      >
        {repo.url}
      </Box>
    </Box>

    <Box
      sx={{
        width: "16px",
        height: "16px",
        borderRadius: "var(--r-xs)",
        flexShrink: 0,
        border: isSelected ? "none" : "1.5px solid var(--border2)",
        background: isSelected ? "var(--accent)" : "transparent",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.15s",
      }}
    >
      {isSelected && (
        <CheckOutlined sx={{ fontSize: "11px", color: "var(--s1)" }} />
      )}
    </Box>
  </Box>
));
