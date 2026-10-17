import type React from "react";
import Box from "@mui/material/Box";
import { useT } from "@/contexts/I18nContext";

interface Props {
  showSelectAll: boolean;
  onSelectAll: () => void;
}

export const RepoListHeader: React.FC<Props> = ({
  showSelectAll,
  onSelectAll,
}) => {
  const t = useT();

  return (
    <Box
      sx={{
        px: "20px",
        pt: "14px",
        pb: "6px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0,
      }}
    >
      <Box
        sx={{
          fontSize: "11px",
          fontWeight: 700,
          color: "var(--text)",
          letterSpacing: "0.04em",
          textTransform: "uppercase",
        }}
      >
        {t("projects.sync_modal.projects_label")}
      </Box>
      {showSelectAll && (
        <Box
          component="button"
          onClick={onSelectAll}
          sx={{
            border: "none",
            background: "transparent",
            color: "var(--accent)",
            fontSize: "12px",
            fontWeight: 600,
            cursor: "pointer",
            outline: "none",
            transition: "color 0.12s",
            "&:hover": { color: "var(--accent2)" },
          }}
        >
          {t("projects.import_modal.select_all")}
        </Box>
      )}
    </Box>
  );
};
