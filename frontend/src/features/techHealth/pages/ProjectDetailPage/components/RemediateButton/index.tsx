import type React from "react";
import { useState } from "react";
import Button from "@mui/material/Button";
import AutoFixHighOutlined from "@mui/icons-material/AutoFixHighOutlined";
import { useToast } from "@/hooks/useToast";
import { useT } from "@/i18n/I18nContext";
import { RemediateModal } from "../RemediateModal";

interface Props {
  projectId: string;
}

export const RemediateButton: React.FC<Props> = ({ projectId }) => {
  const t = useT();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        size="small"
        startIcon={<AutoFixHighOutlined sx={{ fontSize: 16 }} />}
        onClick={() => setOpen(true)}
        sx={{
          textTransform: "none",
          fontSize: "12px",
          color: "var(--accent)",
          border: "1px solid var(--border)",
          borderRadius: "var(--r)",
          px: "10px",
          "&:hover": { background: "var(--s2)" },
        }}
      >
        {t("remediation.button")}
      </Button>
      <RemediateModal
        open={open}
        projectId={projectId}
        onClose={() => setOpen(false)}
        showToast={showToast}
      />
    </>
  );
};
