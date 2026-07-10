import type React from "react";
import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
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
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <Box sx={{ p: "24px", background: "var(--s1)", color: "var(--text)" }}>
        <Box sx={{ fontSize: "16px", fontWeight: 700, mb: "4px" }}>
          {t("remediation.title")}
        </Box>
        <Box sx={{ fontSize: "12px", color: "var(--muted)", mb: "16px" }}>
          {t("remediation.subtitle")}
        </Box>

        {phase === "loading" && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              py: "16px",
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

        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "8px",
            mt: "20px",
          }}
        >
          {phase === "preview" && preview?.canRemediate && (
            <>
              <Button onClick={onClose} sx={{ color: "var(--muted)" }}>
                {t("remediation.cancel")}
              </Button>
              <Button
                variant="contained"
                onClick={handleConfirm}
                sx={{ background: "var(--accent)" }}
              >
                {t("remediation.confirm")}
              </Button>
            </>
          )}
          {phase === "executing" && (
            <Button
              disabled
              variant="contained"
              sx={{ background: "var(--accent)" }}
            >
              <CircularProgress size={16} sx={{ mr: "8px", color: "#fff" }} />
              {t("remediation.executing")}
            </Button>
          )}
          {(phase === "result" ||
            (phase === "preview" && !preview?.canRemediate)) && (
            <Button onClick={onClose} sx={{ color: "var(--muted)" }}>
              {t("remediation.close")}
            </Button>
          )}
        </Box>
      </Box>
    </Dialog>
  );
};
