import type React from "react";
import Box from "@mui/material/Box";
import { SortableTh } from "@/components/ui/common/SortableTh";
import { LoadingStatus } from "@/components/ui/common/LoadingStatus";
import {
  type SkeletonCell,
  TableSkeletonRows,
} from "@/components/ui/common/TableSkeletonRows";
import { DELAYED_REVEAL_SX } from "@/styles/keyframes";
import { useT } from "@/contexts/I18nContext";
import type { SortState } from "@/hooks/useSortState";
import { ApiKeySortField, SortDirection } from "@/enums";
import type { ApiKey } from "@/domains/apiKeys/types";
import { ApiKeyRow } from "@/features/settings/pages/SettingsPage/components/ApiKeyRow";

interface Props {
  keys: ApiKey[];
  fetching: boolean;
  sort: SortState<ApiKeySortField>;
  onSort: (col: ApiKeySortField) => void;
  onRevoke: (apiKey: ApiKey) => void;
  loading?: boolean;
}

const SKELETON_CELLS: readonly SkeletonCell[] = [
  "text",
  "chip",
  "text",
  "text",
  "text",
  "text",
  "empty",
];

export const ApiKeyTable: React.FC<Props> = ({
  keys,
  fetching,
  sort,
  onSort,
  onRevoke,
  loading = false,
}) => {
  const t = useT();

  const columns = [
    {
      col: ApiKeySortField.Name,
      key: "name",
      label: t("settings.api_keys.col_name"),
      width: "auto",
    },
    {
      col: ApiKeySortField.Prefix,
      key: "prefix",
      label: t("settings.api_keys.col_prefix"),
      width: "130px",
    },
    {
      col: ApiKeySortField.CreatedBy,
      key: "created_by",
      label: t("settings.api_keys.col_created_by"),
      width: "160px",
    },
    {
      col: ApiKeySortField.Created,
      key: "created",
      label: t("settings.api_keys.col_created"),
      width: "120px",
    },
    {
      col: ApiKeySortField.Expires,
      key: "expires",
      label: t("settings.api_keys.col_expires"),
      width: "120px",
    },
    {
      col: ApiKeySortField.LastUsed,
      key: "last_used",
      label: t("settings.api_keys.col_last_used"),
      width: "200px",
    },
    {
      col: "actions" as const,
      key: "actions",
      label: "",
      width: "48px",
    },
  ] as const;

  return (
    <Box
      sx={{
        position: "relative",
        flex: 1,
        overflow: loading ? "hidden" : "auto",
        opacity: fetching && !loading ? 0.6 : 1,
        transition: "opacity 0.15s",
      }}
    >
      <Box
        component="table"
        sx={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "12px",
        }}
      >
        <Box component="thead">
          <Box component="tr">
            {columns.map(({ col, key, label, width }) => {
              const sortable = col !== "actions";
              return (
                <SortableTh
                  key={key}
                  width={width}
                  sortable={sortable}
                  active={sort.col === col}
                  ascending={sort.dir === SortDirection.Asc}
                  onSort={() => sortable && onSort(col)}
                >
                  {label}
                </SortableTh>
              );
            })}
          </Box>
        </Box>
        <Box
          component="tbody"
          aria-busy={loading || undefined}
          sx={loading ? DELAYED_REVEAL_SX : undefined}
        >
          {loading ? (
            <TableSkeletonRows cells={SKELETON_CELLS} rows={4} />
          ) : (
            keys.map((key) => (
              <ApiKeyRow key={key.id} apiKey={key} onRevoke={onRevoke} />
            ))
          )}
        </Box>
      </Box>
      {loading && <LoadingStatus label={t("settings.api_keys.loading")} />}
    </Box>
  );
};
