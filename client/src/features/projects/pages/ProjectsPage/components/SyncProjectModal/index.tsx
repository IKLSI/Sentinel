import type React from "react";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import Link from "@mui/material/Link";
import { useT } from "@/contexts/I18nContext";
import { useAvailableReposQuery } from "@/domains/projects/queries";
import { ScanFrequency } from "@/enums";
import { SearchInput } from "@/components/ui/forms/SearchInput";
import { ScanFrequencyPicker } from "@/components/ui/forms/ScanFrequencyPicker";
import { RepoList } from "@/features/projects/pages/ProjectsPage/components/SyncProjectModal/components/RepoList";
import {
  useImportRepos,
  useRepoSelection,
} from "@/features/projects/pages/ProjectsPage/components/SyncProjectModal/hooks";
import {
  emptyRepoListSubtitle,
  emptyRepoListTitle,
  importButtonLabel,
} from "@/features/projects/pages/ProjectsPage/components/SyncProjectModal/helpers";

const sectionLabelSx = {
  fontSize: "11px",
  fontWeight: 700,
  color: "var(--text)",
  letterSpacing: "0.04em",
  textTransform: "uppercase",
} as const;

interface Props {
  open: boolean;
  onClose: () => void;
}

export const SyncProjectModal: React.FC<Props> = ({ open, onClose }) => {
  const t = useT();
  const availableReposQuery = useAvailableReposQuery(open);
  const repos = useMemo(
    () => availableReposQuery.data?.repos ?? [],
    [availableReposQuery.data],
  );
  const hasToken = availableReposQuery.data?.hasToken ?? true;
  const fetchFailed = availableReposQuery.data?.fetchFailed ?? false;
  const fetchFailedStatusCode =
    availableReposQuery.data?.fetchFailedStatusCode ?? null;
  const loading = availableReposQuery.isLoading;
  const error = availableReposQuery.isError;
  const { importRepos, importing } = useImportRepos(onClose);
  const [search, setSearch] = useState("");
  const [scanFrequency, setScanFrequency] = useState<ScanFrequency>(
    ScanFrequency.Weekly,
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const deferredSearch = useDeferredValue(search);

  const visible = useMemo(() => {
    const needle = deferredSearch.toLowerCase();
    return repos.filter((r) => r.name.toLowerCase().includes(needle));
  }, [repos, deferredSearch]);

  const { selected, toggle, selectAll, clear } = useRepoSelection(
    visible.map((r) => r.url),
  );

  useEffect(() => {
    if (!open) return;
    setSearch("");
    clear();
    setScanFrequency(ScanFrequency.Weekly);
    setTimeout(() => inputRef.current?.focus(), 80);
  }, [open, clear]);

  const handleImport = () => {
    if (selected.size === 0) return;
    importRepos(
      repos.filter((r) => selected.has(r.url)),
      scanFrequency,
    );
  };

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

      <Box sx={{ px: "20px", pt: "16px", flexShrink: 0 }}>
        <SearchInput
          inputRef={inputRef}
          value={search}
          onChange={setSearch}
          onEscape={onClose}
          placeholder={t("projects.search_placeholder")}
          width="100%"
          sx={{ background: "var(--bg)" }}
        />
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
        <Box sx={sectionLabelSx}>{t("projects.sync_modal.projects_label")}</Box>
        {!loading && !error && repos.length > 0 && (
          <Link
            component="button"
            type="button"
            underline="none"
            onClick={selectAll}
            sx={{
              color: "var(--accent)",
              fontSize: "12px",
              fontWeight: 600,
              transition: "color 0.12s",
              "&:hover": { color: "var(--accent2)" },
            }}
          >
            {t("projects.import_modal.select_all")}
          </Link>
        )}
      </Box>

      <RepoList
        loading={loading}
        error={error}
        hasRepos={repos.length > 0}
        visible={visible}
        selected={selected}
        onToggle={toggle}
        emptyTitle={emptyRepoListTitle(t, hasToken, fetchFailed)}
        emptySubtitle={emptyRepoListSubtitle(
          t,
          hasToken,
          fetchFailed,
          fetchFailedStatusCode,
        )}
      />

      {selected.size > 0 && (
        <Box
          sx={{
            px: "20px",
            py: "12px",
            borderTop: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            flexShrink: 0,
          }}
        >
          <Box sx={sectionLabelSx}>{t("projects.modal.frequency_label")}</Box>
          <ScanFrequencyPicker
            value={scanFrequency}
            onChange={setScanFrequency}
            disabled={importing}
          />
        </Box>
      )}

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
          color="inherit"
          onClick={onClose}
          disabled={importing}
        >
          {t("projects.import_modal.cancel")}
        </Button>
        <Button
          variant="contained"
          size="small"
          disabled={selected.size === 0 || importing}
          onClick={handleImport}
        >
          {importButtonLabel(t, importing, selected.size)}
        </Button>
      </Box>
    </Dialog>
  );
};
