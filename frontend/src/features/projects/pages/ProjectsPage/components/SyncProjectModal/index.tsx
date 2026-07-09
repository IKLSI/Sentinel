import type React from "react";
import { useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import SearchOutlined from "@mui/icons-material/SearchOutlined";
import FolderOutlined from "@mui/icons-material/FolderOutlined";
import CheckOutlined from "@mui/icons-material/CheckOutlined";
import { useT } from "@/i18n/I18nContext";
import {
  getAvailableRepos,
  createProject,
  type AvailableRepoDto,
} from "@/features/techHealth/api/projects";
import { extractApiError } from "@/utils/apiError";

interface Props {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
  showToast: (
    msg: string,
    type: "success" | "error" | "info" | "warning",
  ) => void;
}

export const SyncProjectModal: React.FC<Props> = ({
  open,
  onClose,
  onImported,
  showToast,
}) => {
  const t = useT();
  const [repos, setRepos] = useState<AvailableRepoDto[]>([]);
  const [hasToken, setHasToken] = useState(true);
  const [fetchFailed, setFetchFailed] = useState(false);
  const [fetchFailedStatusCode, setFetchFailedStatusCode] = useState<
    number | undefined
  >(undefined);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const ctrl = new AbortController();
    setLoading(true);
    setError(false);
    setHasToken(true);
    setFetchFailed(false);
    setFetchFailedStatusCode(undefined);
    setSearch("");
    setSelected(new Set());
    getAvailableRepos(ctrl.signal)
      .then((data) => {
        if (ctrl.signal.aborted) return;
        setRepos(data.repos);
        setHasToken(data.hasToken);
        setFetchFailed(data.fetchFailed);
        setFetchFailedStatusCode(data.fetchFailedStatusCode);
      })
      .catch(() => {
        if (!ctrl.signal.aborted) setError(true);
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });
    setTimeout(() => inputRef.current?.focus(), 80);
    return () => ctrl.abort();
  }, [open]);

  const visible = repos.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()),
  );

  const toggle = (url: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });

  const selectAll = () => {
    const urls = visible.map((r) => r.url);
    const allSel = urls.every((u) => selected.has(u));
    setSelected((prev) =>
      allSel
        ? new Set([...prev].filter((u) => !urls.includes(u)))
        : new Set([...prev, ...urls]),
    );
  };

  const handleImport = async () => {
    if (selected.size === 0) return;
    setImporting(true);
    try {
      const toImport = repos.filter((r) => selected.has(r.url));
      await Promise.all(
        toImport.map((r) =>
          createProject({
            name: r.name,
            repositoryUrl: r.url,
            repositoryType: r.platform,
          }),
        ),
      );
      showToast(
        t("projects.toast.import_success", { count: toImport.length }),
        "success",
      );
      onClose();
      onImported();
    } catch (err) {
      showToast(
        extractApiError(err, t("projects.toast.import_error")),
        "error",
      );
    } finally {
      setImporting(false);
    }
  };

  const importLabel = importing
    ? t("projects.import_modal.importing")
    : selected.size > 0
      ? t("projects.import_modal.import_count", { count: selected.size })
      : t("projects.import_modal.import");

  const emptyTitle = !hasToken
    ? t("projects.import_modal.no_token")
    : fetchFailed
      ? t("projects.import_modal.fetch_failed_title")
      : t("projects.import_modal.empty");

  const emptySubtitle =
    hasToken && fetchFailed
      ? fetchFailedStatusCode != null
        ? t("projects.import_modal.fetch_failed_subtitle", {
            status: fetchFailedStatusCode,
          })
        : t("projects.import_modal.fetch_failed_subtitle_generic")
      : undefined;

  return (
    <Dialog
      open={open}
      onClose={importing ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            bgcolor: "var(--s1)",
            border: "1px solid",
            borderColor: "divider",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            maxHeight: "600px",
          },
        },
      }}
    >
      <Box
        sx={{
          fontSize: "14px",
          fontWeight: 700,
          letterSpacing: "-0.02em",
          p: "16px 24px",
          borderBottom: "1px solid var(--border)",
          background:
            "linear-gradient(135deg, var(--accent-subtle) 0%, var(--s2) 60%)",
          flexShrink: 0,
          color: "var(--text)",
        }}
      >
        {t("projects.import_modal.title")}
      </Box>

      <Box sx={{ px: "20px", pt: "16px", pb: "0", flexShrink: 0 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "var(--bg)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r)",
            px: "10px",
            height: "32px",
            transition: "border-color 0.15s, box-shadow 0.15s",
            "&:focus-within": {
              borderColor: "var(--accent-border)",
              boxShadow: "0 0 0 3px var(--accent-subtle)",
            },
          }}
        >
          <SearchOutlined
            sx={{ color: "var(--muted)", fontSize: "14px", flexShrink: 0 }}
          />
          <Box
            component="input"
            ref={inputRef}
            placeholder={t("projects.search_placeholder")}
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSearch(e.target.value)
            }
            onKeyDown={(e: React.KeyboardEvent) => {
              if (e.key === "Escape") onClose();
            }}
            sx={{
              all: "unset",
              flex: 1,
              fontSize: "12.5px",
              color: "var(--text)",
              "&::placeholder": { color: "var(--muted)" },
              "&:focus": { outline: "none", boxShadow: "none !important" },
            }}
          />
        </Box>
      </Box>

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
        {!loading && !error && repos.length > 0 && (
          <Box
            component="button"
            onClick={selectAll}
            sx={{
              border: "none",
              background: "transparent",
              color: "var(--accent)",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              outline: "none",
              "&:hover": { textDecoration: "underline" },
            }}
          >
            {t("projects.import_modal.select_all")}
          </Box>
        )}
      </Box>

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          px: "12px",
          pb: "8px",
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        {loading ? (
          <Box sx={{ py: "40px", display: "flex", justifyContent: "center" }}>
            <CircularProgress size={24} />
          </Box>
        ) : error ? (
          <Box
            sx={{
              py: "40px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Box
              sx={{
                fontSize: "13px",
                color: "var(--red)",
                fontWeight: 500,
                textAlign: "center",
              }}
            >
              {t("projects.import_modal.error")}
            </Box>
          </Box>
        ) : visible.length === 0 ? (
          <Box className="empty-state">
            <FolderOutlined
              className="empty-state-icon"
              sx={{ fontSize: 40 }}
            />
            <Box className="empty-state-title">
              {repos.length === 0
                ? emptyTitle
                : t("projects.sync_modal.no_results")}
            </Box>
            {repos.length === 0 && emptySubtitle && (
              <Box className="empty-state-subtitle">{emptySubtitle}</Box>
            )}
          </Box>
        ) : (
          visible.map((repo) => {
            const isSelected = selected.has(repo.url);
            return (
              <Box
                key={repo.url}
                onClick={() => toggle(repo.url)}
                onMouseDown={(e) => e.preventDefault()}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: "11px",
                  px: "10px",
                  py: "9px",
                  borderRadius: "var(--r)",
                  mb: "2px",
                  background: isSelected
                    ? "var(--accent-subtle)"
                    : "transparent",
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
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {repo.name}
                  </Box>
                  <Box
                    sx={{
                      mt: "2px",
                      fontSize: "11.5px",
                      color: "var(--muted2)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
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
                    <CheckOutlined
                      sx={{ fontSize: "11px", color: "var(--s1)" }}
                    />
                  )}
                </Box>
              </Box>
            );
          })
        )}
      </Box>

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
          sx={{ textTransform: "none" }}
          onClick={onClose}
          disabled={importing}
        >
          {t("projects.import_modal.cancel")}
        </Button>
        <Button
          variant="contained"
          size="small"
          disableElevation
          disabled={selected.size === 0 || importing}
          sx={{
            textTransform: "none",
            background:
              "linear-gradient(135deg, var(--accent) 0%, color-mix(in srgb, var(--accent) 92%, white) 100%)",
            color: "#fff",
            boxShadow: "none",
            "&:hover": {
              background:
                "linear-gradient(135deg, color-mix(in srgb, var(--accent) 85%, black) 0%, var(--accent) 100%)",
              boxShadow: "none",
              transform: "none",
            },
            "&.Mui-disabled": { opacity: 0.5 },
          }}
          onClick={handleImport}
        >
          {importLabel}
        </Button>
      </Box>
    </Dialog>
  );
};
