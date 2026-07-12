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
        variant="contained"
        size="small"
        startIcon={<AutoFixHighOutlined sx={{ fontSize: 14 }} />}
        onClick={() => setOpen(true)}
        sx={{
          "&.MuiButton-root:hover": { transform: "none" },
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
