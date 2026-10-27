import type React from "react";
import Box from "@mui/material/Box";
import DeleteOutlineOutlined from "@mui/icons-material/DeleteOutlineOutlined";
import { RowActions } from "@/components/ui/common/table/RowActions";
import { SortableTh } from "@/components/ui/common/table/SortableTh";
import { LoadingStatus } from "@/components/ui/common/feedback/LoadingStatus";
import {
  type SkeletonCell,
  TableSkeletonRows,
} from "@/components/ui/common/table/TableSkeletonRows";
import { DELAYED_REVEAL_SX } from "@/styles/keyframes";
import { useI18n } from "@/contexts/I18nContext";
import type { SortState } from "@/hooks/useSortState";
import { ApiKeySortField, SortDirection } from "@/enums";
import type { ApiKey } from "@/domains/apiKeys/types";
import { formatDate as fmtDate } from "@/formatters/date";

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
  const { t, culture } = useI18n();

  const renderExpiry = (apiKey: ApiKey) => {
    if (!apiKey.expiresAt)
      return (
        <Box component="span" sx={{ color: "var(--muted)" }}>
          {t("settings.api_keys.no_expiry")}
        </Box>
      );
    const expired = new Date(apiKey.expiresAt).getTime() < Date.now();
    return (
      <Box
        component="span"
        sx={{
          color: expired ? "var(--red)" : "var(--text-secondary)",
          fontWeight: expired ? 600 : 400,
        }}
      >
        {fmtDate(apiKey.expiresAt, culture)}
      </Box>
    );
  };

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
            keys.map((apiKey) => (
              <Box
                key={apiKey.id}
                component="tr"
                sx={{
                  borderBottom: "1px solid var(--border)",
                  "&:last-child": { borderBottom: "none" },
                  "&:hover": { background: "var(--s2)" },
                  "&:hover .row-actions": { opacity: "1 !important" },
                  transition: "background 0.1s",
                  "& > td": { px: "16px", py: "8px" },
                }}
              >
                <Box
                  component="td"
                  sx={{ fontWeight: 500, color: "var(--text)" }}
                >
                  {apiKey.name}
                </Box>
                <Box component="td">
                  <Box
                    component="span"
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      px: "7px",
                      height: "20px",
                      borderRadius: "var(--r-xs, 5px)",
                      background: "var(--s3)",
                      border: "1px solid var(--border)",
                      fontFamily: "monospace",
                      fontSize: "11px",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {apiKey.prefix}…
                  </Box>
                </Box>
                <Box component="td" sx={{ color: "var(--text-secondary)" }}>
                  {apiKey.createdByName}
                </Box>
                <Box component="td" sx={{ color: "var(--text-secondary)" }}>
                  {fmtDate(apiKey.createdAt, culture)}
                </Box>
                <Box component="td">{renderExpiry(apiKey)}</Box>
                <Box
                  component="td"
                  sx={{
                    color: apiKey.lastUsedAt
                      ? "var(--text-secondary)"
                      : "var(--muted)",
                    fontSize: "11px",
                  }}
                >
                  {apiKey.lastUsedAt
                    ? fmtDate(apiKey.lastUsedAt, culture)
                    : t("settings.api_keys.never_used")}
                </Box>
                <Box component="td" sx={{ textAlign: "right" }}>
                  <RowActions
                    actions={[
                      {
                        icon: <DeleteOutlineOutlined sx={{ fontSize: 15 }} />,
                        label: t("settings.api_keys.revoke"),
                        onClick: () => onRevoke(apiKey),
                        color: "red",
                      },
                    ]}
                  />
                </Box>
              </Box>
            ))
          )}
        </Box>
      </Box>
      {loading && <LoadingStatus label={t("settings.api_keys.loading")} />}
    </Box>
  );
};
