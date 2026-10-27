import type React from "react";
import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
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
      <Table sx={{ fontSize: "12px" }}>
        <TableHead>
          <TableRow>
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
          </TableRow>
        </TableHead>
        <TableBody
          aria-busy={loading || undefined}
          sx={loading ? DELAYED_REVEAL_SX : undefined}
        >
          {loading ? (
            <TableSkeletonRows cells={SKELETON_CELLS} rows={4} />
          ) : (
            keys.map((apiKey) => (
              <TableRow key={apiKey.id} hover>
                <TableCell sx={{ fontWeight: 500, color: "var(--text)" }}>
                  {apiKey.name}
                </TableCell>
                <TableCell>
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
                      fontFamily: "var(--font-mono)",
                      fontSize: "11px",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {apiKey.prefix}…
                  </Box>
                </TableCell>
                <TableCell sx={{ color: "var(--text-secondary)" }}>
                  {apiKey.createdByName}
                </TableCell>
                <TableCell sx={{ color: "var(--text-secondary)" }}>
                  {fmtDate(apiKey.createdAt, culture)}
                </TableCell>
                <TableCell>{renderExpiry(apiKey)}</TableCell>
                <TableCell
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
                </TableCell>
                <TableCell align="right">
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
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      {loading && <LoadingStatus label={t("settings.api_keys.loading")} />}
    </Box>
  );
};
