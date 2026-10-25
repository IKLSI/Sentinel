import type React from "react";
import { useRef } from "react";
import Box from "@mui/material/Box";
import FolderOutlined from "@mui/icons-material/FolderOutlined";
import { useT } from "@/contexts/I18nContext";
import type { AvailableRepo } from "@/domains/projects/types";
import { useVirtualRows } from "@/hooks/useVirtualRows";
import { RepoRow } from "@/features/projects/pages/ProjectsPage/components/RepoRow";
import { EmptyState } from "@/components/ui/common/EmptyState";
import { ListSkeleton } from "@/components/ui/common/ListSkeleton";

const REPO_ROW_ESTIMATED_HEIGHT_PX = 56;

interface Props {
  loading: boolean;
  error: boolean;
  hasRepos: boolean;
  visible: AvailableRepo[];
  selected: Set<string>;
  onToggle: (url: string) => void;
  emptyTitle: string;
  emptySubtitle: string | undefined;
}

export const RepoList: React.FC<Props> = ({
  loading,
  error,
  hasRepos,
  visible,
  selected,
  onToggle,
  emptyTitle,
  emptySubtitle,
}) => {
  const t = useT();
  const listRef = useRef<HTMLDivElement>(null);

  const virtualRows = useVirtualRows({
    count: visible.length,
    getScrollElement: () => listRef.current,
    estimateSize: REPO_ROW_ESTIMATED_HEIGHT_PX,
  });

  return (
    <Box
      ref={listRef}
      sx={{
        flex: 1,
        minHeight: 0,
        overflowY: "auto",
        px: "12px",
        pb: "8px",
        "&::-webkit-scrollbar-thumb": { background: "var(--border)" },
        "&:hover::-webkit-scrollbar-thumb": { background: "var(--border2)" },
        "@supports not selector(::-webkit-scrollbar)": {
          scrollbarWidth: "thin",
          scrollbarColor: "var(--border) transparent",
          "&:hover": { scrollbarColor: "var(--border2) transparent" },
        },
      }}
    >
      {loading ? (
        <Box sx={{ py: "12px", display: "flex" }}>
          <ListSkeleton rows={5} rowHeight={48} />
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
        <EmptyState
          icon={FolderOutlined}
          iconSize={40}
          title={hasRepos ? t("projects.sync_modal.no_results") : emptyTitle}
          subtitle={hasRepos ? undefined : emptySubtitle}
          sx={{ p: { xs: "40px 20px", md: "72px 24px" } }}
        />
      ) : (
        <Box
          sx={{
            paddingTop: `${virtualRows.paddingTop}px`,
            paddingBottom: `${virtualRows.paddingBottom}px`,
          }}
        >
          {virtualRows.items.map((item) => {
            const repo = visible[item.index];
            return (
              <Box
                key={repo.url}
                data-index={item.index}
                ref={virtualRows.virtualizer.measureElement}
                sx={{ pb: "2px" }}
              >
                <RepoRow
                  repo={repo}
                  isSelected={selected.has(repo.url)}
                  onToggle={onToggle}
                />
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
};
