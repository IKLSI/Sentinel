import type React from "react";
import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import CircularProgress from "@mui/material/CircularProgress";
import { useT } from "@/i18n/I18nContext";
import {
  getRemediationPreview,
  executeRemediation,
  type RemediationPreviewDto,
  type RemediationResultDto,
} from "@/features/techHealth/api/remediation";
import { extractApiError } from "@/utils/apiError";
import { STATUS_SUCCESS, type Phase } from "./constants";
import { PreviewContent } from "./PreviewContent";
import { ResultContent } from "./ResultContent";

interface Props {
  open: boolean;
  projectId: string;
  onClose: () => void;
  showToast: (
    msg: string,
    type: "success" | "error" | "info" | "warning",
  ) => void;
}

export const RemediateModal: React.FC<Props> = ({
  open,
  projectId,
  onClose,
  showToast,
}) => {
  const t = useT();
  const [phase, setPhase] = useState<Phase>("loading");
  const [preview, setPreview] = useState<RemediationPreviewDto | null>(null);
  const [result, setResult] = useState<RemediationResultDto | null>(null);

  useEffect(() => {
    if (!open) return;
    const ctrl = new AbortController();
    setPhase("loading");
    setPreview(null);
    setResult(null);

    getRemediationPreview(projectId, ctrl.signal)
      .then((data) => {
        if (ctrl.signal.aborted) return;
        setPreview(data);
        setPhase("preview");
      })
      .catch(() => {
        if (ctrl.signal.aborted) return;
        showToast(t("remediation.error_generic"), "error");
        onClose();
      });

    return () => ctrl.abort();
  }, [open, projectId, showToast, onClose, t]);

  const handleConfirm = async () => {
    setPhase("executing");
    try {
      const data = await executeRemediation(projectId);
      setResult(data);
      setPhase("result");
      if (data.status === STATUS_SUCCESS)
        showToast(t("remediation.success"), "success");
      else showToast(data.error ?? t("remediation.failed"), "error");
    } catch (e) {
      showToast(extractApiError(e, t("remediation.error_generic")), "error");
      setPhase("preview");
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            bgcolor: "var(--s1)",
            border: "1px solid",
            borderColor: "divider",
            borderRadius: "10px",
            overflow: "hidden",
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          fontSize: "14px",
          fontWeight: 700,
          letterSpacing: "-0.02em",
          p: "16px 20px",
          borderBottom: "1px solid var(--border)",
          background:
            "linear-gradient(135deg, var(--accent-subtle) 0%, var(--s2) 60%)",
        }}
      >
        {t("remediation.title")}
      </DialogTitle>

      <DialogContent sx={{ pt: "18px !important", pb: "18px" }}>
        {phase === "loading" && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              py: "24px",
            }}
          >
            <CircularProgress size={18} />
            <Box sx={{ fontSize: "13px", color: "var(--muted)" }}>
              {t("remediation.loading")}
            </Box>
          </Box>
        )}

        {phase === "preview" && preview && !preview.canRemediate && (
          <Box sx={{ fontSize: "13px", color: "var(--muted)", py: "12px" }}>
            {preview.reason ?? t("remediation.none")}
          </Box>
        )}

        {(phase === "preview" || phase === "executing") &&
          preview?.canRemediate && <PreviewContent preview={preview} t={t} />}

        {phase === "result" && result && (
          <ResultContent result={result} t={t} />
        )}
      </DialogContent>

      <DialogActions
        sx={{
          p: "12px 20px",
          borderTop: "1px solid var(--border)",
          background: "var(--s2)",
          gap: "8px",
        }}
      >
        {phase === "preview" && preview?.canRemediate && (
          <>
            <Button
              variant="contained"
              size="small"
              className="btn-cancel"
              sx={{ textTransform: "none" }}
              onClick={onClose}
            >
              {t("remediation.cancel")}
            </Button>
            <Button
              variant="contained"
              size="small"
              sx={{
                textTransform: "none",
                background:
                  "linear-gradient(135deg, var(--accent) 0%, color-mix(in srgb, var(--accent) 92%, white) 100%)",
                boxShadow: "none",
                "&:hover": {
                  background:
                    "linear-gradient(135deg, color-mix(in srgb, var(--accent) 85%, black) 0%, var(--accent) 100%)",
                  boxShadow: "none",
                  transform: "none",
                },
              }}
              onClick={handleConfirm}
            >
              {t("remediation.confirm")}
            </Button>
          </>
        )}
        {phase === "executing" && (
          <Button
            disabled
            variant="contained"
            size="small"
            sx={{
              textTransform: "none",
              background: "var(--accent)",
              "&.Mui-disabled": { background: "var(--accent)", opacity: 0.7 },
            }}
          >
            <CircularProgress size={16} sx={{ mr: "8px", color: "#fff" }} />
            {t("remediation.executing")}
          </Button>
        )}
        {(phase === "result" ||
          (phase === "preview" && !preview?.canRemediate)) && (
          <Button
            variant="contained"
            size="small"
            className="btn-cancel"
            sx={{ textTransform: "none" }}
            onClick={onClose}
          >
            {t("remediation.close")}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
