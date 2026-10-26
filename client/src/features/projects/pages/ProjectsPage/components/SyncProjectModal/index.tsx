import type React from "react";
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import { useT } from "@/contexts/I18nContext";
import { useImportProjectsMutation } from "@/domains/projects/mutations";
import { useAvailableReposQuery } from "@/domains/projects/queries";
import { ScanFrequency } from "@/enums";
import { useApiErrorToast } from "@/hooks/useApiErrorToast";
import { useToast } from "@/hooks/useToast";
import { SearchInput } from "@/components/ui/forms/SearchInput";
import { RepoListHeader } from "@/features/projects/pages/ProjectsPage/components/RepoListHeader";
import { RepoList } from "@/features/projects/pages/ProjectsPage/components/RepoList";
import { ImportFrequencyBar } from "@/features/projects/pages/ProjectsPage/components/ImportFrequencyBar";
import { ImportModalActions } from "@/features/projects/pages/ProjectsPage/components/ImportModalActions";

interface Props {
  open: boolean;
  onClose: () => void;
}

export const SyncProjectModal: React.FC<Props> = ({ open, onClose }) => {
  const t = useT();
  const { showToast } = useToast();
  const onImportError = useApiErrorToast("projects.toast.import_error");
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
  const importProjectsMutation = useImportProjectsMutation();
  const importing = importProjectsMutation.isPending;
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [scanFrequency, setScanFrequency] = useState<ScanFrequency>(
    ScanFrequency.Weekly,
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    if (!open) return;
    setSearch("");
    setSelected(new Set());
    setScanFrequency(ScanFrequency.Weekly);
    setTimeout(() => inputRef.current?.focus(), 80);
  }, [open]);

  const visible = useMemo(() => {
    const needle = deferredSearch.toLowerCase();
    return repos.filter((r) => r.name.toLowerCase().includes(needle));
  }, [repos, deferredSearch]);

  const toggle = useCallback(
    (url: string) =>
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(url)) next.delete(url);
        else next.add(url);
        return next;
      }),
    [],
  );

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
    const toImport = repos.filter((r) => selected.has(r.url));
    try {
      await importProjectsMutation.mutateAsync({
        data: {
          projects: toImport.map((r) => ({
            name: r.name,
            repositoryUrl: r.url,
            repositoryType: r.platform,
            scanFrequency,
          })),
        },
      });
      showToast(
        t("projects.toast.import_success", { count: toImport.length }),
        "success",
      );
      onClose();
    } catch (err) {
      onImportError(err);
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

      <RepoListHeader
        showSelectAll={!loading && !error && repos.length > 0}
        onSelectAll={selectAll}
      />

      <RepoList
        loading={loading}
        error={error}
        hasRepos={repos.length > 0}
        visible={visible}
        selected={selected}
        onToggle={toggle}
        emptyTitle={emptyTitle}
        emptySubtitle={emptySubtitle}
      />

      {selected.size > 0 && (
        <ImportFrequencyBar
          value={scanFrequency}
          onChange={setScanFrequency}
          disabled={importing}
        />
      )}

      <ImportModalActions
        importLabel={importLabel}
        importing={importing}
        importDisabled={selected.size === 0 || importing}
        onCancel={onClose}
        onImport={handleImport}
      />
    </Dialog>
  );
};
