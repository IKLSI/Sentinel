import type React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { useT } from "@/contexts/I18nContext";

interface Props {
  importLabel: string;
  importing: boolean;
  importDisabled: boolean;
  onCancel: () => void;
  onImport: () => void;
}

export const ImportModalActions: React.FC<Props> = ({
  importLabel,
  importing,
  importDisabled,
  onCancel,
  onImport,
}) => {
  const t = useT();

  return (
    <Box
      sx={{
        p: "14px 20px",
        borderTop: "1px solid var(--border)",
        background: "var(--s2)",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        flexShrink: 0,
        gap: "8px",
      }}
    >
      <Button
        variant="contained"
        size="small"
        className="btn-cancel"
        onClick={onCancel}
        disabled={importing}
      >
        {t("projects.import_modal.cancel")}
      </Button>
      <Button
        variant="contained"
        size="small"
        disabled={importDisabled}
        onClick={onImport}
      >
        {importLabel}
      </Button>
    </Box>
  );
};
