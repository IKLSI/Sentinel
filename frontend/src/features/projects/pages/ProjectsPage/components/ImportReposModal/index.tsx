import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import CircularProgress from "@mui/material/CircularProgress";
import Chip from "@mui/material/Chip";
import FormControlLabel from "@mui/material/FormControlLabel";
import { AppModal } from "@/components/AppModal";
import { useT } from "@/i18n/I18nContext";
import {
  getAvailableRepos,
  createProject,
  AvailableRepoDto,
} from "@/features/techHealth/api/projects";
import { extractApiError } from "@/utils/apiError";

interface Props {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
  showToast: (msg: string, type: "success" | "error" | "info" | "warning") => void;
}

export const ImportReposModal: React.FC<Props> = ({
  open,
  onClose,
  onImported,
  showToast,
}) => {
  const t = useT();
  const [repos, setRepos] = useState<AvailableRepoDto[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!open) return;
    const ctrl = new AbortController();
    setLoading(true);
    setError(false);
    setSelected(new Set());
    getAvailableRepos(ctrl.signal)
      .then((data) => {
        if (!ctrl.signal.aborted) setRepos(data);
      })
      .catch(() => {
        if (!ctrl.signal.aborted) setError(true);
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });
    return () => ctrl.abort();
  }, [open]);

  const toggleRepo = (url: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === repos.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(repos.map((r) => r.url)));
    }
  };

  const handleImport = async () => {
    if (selected.size === 0) return;
    setImporting(true);
    try {
      const toImport = repos.filter((r) => selected.has(r.url));
      await Promise.all(
        toImport.map((r) =>
          createProject({ name: r.name, repositoryUrl: r.url })
        )
      );
      showToast(t("projects.toast.import_success", { count: toImport.length }), "success");
      onClose();
      onImported();
    } catch (err) {
      showToast(extractApiError(err, t("projects.toast.import_error")), "error");
    } finally {
      setImporting(false);
    }
  };

  const importLabel = importing
    ? t("projects.import_modal.importing")
    : selected.size > 0
      ? t("projects.import_modal.import_count", { count: selected.size })
      : t("projects.import_modal.import");

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={t("projects.import_modal.title")}
      maxWidth="sm"
      actions={
        <>
          <Button
            variant="contained"
            size="small"
            className="btn-cancel"
            sx={{ textTransform: "none" }}
            onClick={onClose}
            disabled={importing}
          >
            {t("projects.import_modal.cancel")}
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
            onClick={handleImport}
            disabled={selected.size === 0 || importing}
          >
            {importLabel}
          </Button>
        </>
      }
    >
      <Box sx={{ minHeight: "120px" }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", pt: "24px" }}>
            <CircularProgress size={24} />
          </Box>
        ) : error ? (
          <Box sx={{ color: "var(--red)", fontSize: "14px", textAlign: "center", pt: "24px" }}>
            {t("projects.import_modal.error")}
          </Box>
        ) : repos.length === 0 ? (
          <Box sx={{ color: "var(--muted)", fontSize: "14px", textAlign: "center", pt: "24px" }}>
            {t("projects.import_modal.empty")}
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={selected.size === repos.length}
                  indeterminate={selected.size > 0 && selected.size < repos.length}
                  onChange={toggleAll}
                  sx={{ color: "var(--muted)", "&.Mui-checked": { color: "var(--accent)" }, "&.MuiCheckbox-indeterminate": { color: "var(--accent)" } }}
                />
              }
              label={
                <Box sx={{ fontSize: "13px", color: "var(--muted)", fontFamily: "var(--font-ui)" }}>
                  {t("projects.import_modal.select_all")}
                </Box>
              }
              sx={{ mb: "4px" }}
            />
            <Box
              sx={{
                maxHeight: "340px",
                overflow: "auto",
                display: "flex",
                flexDirection: "column",
                gap: "2px",
                "&::-webkit-scrollbar": { width: "4px" },
                "&::-webkit-scrollbar-thumb": { background: "var(--border2)", borderRadius: "50%" },
                "&::-webkit-scrollbar-track": { background: "transparent" },
              }}
            >
              {repos.map((repo) => (
                <Box
                  key={repo.url}
                  onClick={() => toggleRepo(repo.url)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    px: "8px",
                    py: "6px",
                    borderRadius: "var(--r)",
                    cursor: "pointer",
                    transition: "background 0.12s",
                    "&:hover": { background: "var(--s2)" },
                    background: selected.has(repo.url) ? "var(--accent-subtle)" : "transparent",
                  }}
                >
                  <Checkbox
                    size="small"
                    checked={selected.has(repo.url)}
                    onChange={() => toggleRepo(repo.url)}
                    onClick={(e) => e.stopPropagation()}
                    sx={{ p: 0, color: "var(--muted)", "&.Mui-checked": { color: "var(--accent)" } }}
                  />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ fontSize: "14px", color: "var(--text)", fontFamily: "var(--font-ui)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {repo.name}
                    </Box>
                    <Box sx={{ fontSize: "12px", color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {repo.url}
                    </Box>
                  </Box>
                  <Chip
                    label={repo.platform}
                    size="small"
                    sx={{
                      height: "18px",
                      fontSize: "10px",
                      fontFamily: "var(--font-ui)",
                      background: repo.platform === "GitHub" ? "var(--s2)" : "color-mix(in srgb, #FC6D26 15%, transparent)",
                      color: repo.platform === "GitHub" ? "var(--muted)" : "#FC6D26",
                      border: "none",
                      flexShrink: 0,
                    }}
                  />
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </Box>
    </AppModal>
  );
};
