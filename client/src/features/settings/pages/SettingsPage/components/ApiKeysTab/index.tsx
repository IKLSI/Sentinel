import type React from "react";
import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import KeyOutlined from "@mui/icons-material/KeyOutlined";
import { DeleteModal } from "@/components/ui/common/modal/DeleteModal";
import { EmptyState } from "@/components/ui/common/feedback/EmptyState";
import { useT } from "@/contexts/I18nContext";
import { useDeleteDialog } from "@/hooks/useDeleteDialog";
import { useSortState } from "@/hooks/useSortState";
import { ApiKeySortField, SortDirection } from "@/enums";
import { useRevokeApiKeyMutation } from "@/domains/apiKeys/mutations";
import { useApiKeysQuery } from "@/domains/apiKeys/queries";
import type { ApiKey, CreatedApiKey } from "@/domains/apiKeys/types";
import { ApiKeyCreateDialog } from "@/features/settings/pages/SettingsPage/components/ApiKeysTab/components/ApiKeyCreateDialog";
import { ApiKeySecretDialog } from "@/features/settings/pages/SettingsPage/components/ApiKeysTab/components/ApiKeySecretDialog";
import { ApiKeyTable } from "@/features/settings/pages/SettingsPage/components/ApiKeysTab/components/ApiKeyTable";
import { PANEL_SX } from "@/helpers/cardSx";

export const ApiKeysTab: React.FC = () => {
  const t = useT();

  const [sort, toggleSort] = useSortState<ApiKeySortField>({
    col: ApiKeySortField.Expires,
    dir: SortDirection.Asc,
  });

  const apiKeysQuery = useApiKeysQuery({
    sortBy: sort.col,
    sortDirection: sort.dir,
  });
  const keys = apiKeysQuery.data ?? [];
  const loading = apiKeysQuery.isLoading;
  const revokeDialog = useDeleteDialog<ApiKey>(
    useRevokeApiKeyMutation(),
    "settings.api_keys.revoke_error",
    ({ name }) => t("settings.api_keys.revoke_success", { name }),
  );
  const revokeTarget = revokeDialog.target;

  const [createOpen, setCreateOpen] = useState(false);
  const [secretKey, setSecretKey] = useState<CreatedApiKey | null>(null);

  const handleCreated = (created: CreatedApiKey) => {
    setCreateOpen(false);
    setSecretKey(created);
  };

  return (
    <>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          mb: "12px",
          flexShrink: 0,
        }}
      >
        <Button
          variant="contained"
          size="small"
          startIcon={<KeyOutlined sx={{ fontSize: "13px !important" }} />}
          onClick={() => setCreateOpen(true)}
          sx={{ height: "34px", px: "16px" }}
        >
          {t("settings.api_keys.create")}
        </Button>
      </Box>

      <Box
        sx={{
          flex: 1,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          ...PANEL_SX,
        }}
      >
        {!loading && keys.length === 0 ? (
          <EmptyState
            icon={KeyOutlined}
            title={t("settings.api_keys.empty")}
            subtitle={t("settings.api_keys.empty_subtitle")}
            sx={{ flex: 1 }}
          />
        ) : (
          <ApiKeyTable
            keys={keys}
            fetching={apiKeysQuery.isFetching}
            sort={sort}
            onSort={toggleSort}
            onRevoke={revokeDialog.setTarget}
            loading={loading}
          />
        )}
      </Box>

      <ApiKeyCreateDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={handleCreated}
      />

      <ApiKeySecretDialog
        secretKey={secretKey}
        onClose={() => setSecretKey(null)}
      />

      <DeleteModal
        open={revokeTarget !== null}
        onClose={revokeDialog.closeDialog}
        onConfirm={revokeDialog.confirm}
        loading={revokeDialog.deleting}
        title={t("settings.api_keys.revoke")}
        confirmLabel={t("settings.api_keys.revoke_confirm_yes")}
        confirmingLabel="…"
      >
        {t("settings.api_keys.revoke_confirm")}
        {revokeTarget && <b> {revokeTarget.name}</b>}
      </DeleteModal>
    </>
  );
};
