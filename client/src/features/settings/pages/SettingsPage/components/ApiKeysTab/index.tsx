import type React from "react";
import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import KeyOutlined from "@mui/icons-material/KeyOutlined";
import { DeleteModal } from "@/components/ui/common/DeleteModal";
import { EmptyState } from "@/components/ui/common/EmptyState";
import { useT } from "@/contexts/I18nContext";
import { useApiErrorToast } from "@/hooks/useApiErrorToast";
import { useSortState } from "@/hooks/useSortState";
import { ApiKeySortField, SortDirection } from "@/enums";
import { useRevokeApiKeyMutation } from "@/domains/apiKeys/mutations";
import { useApiKeysQuery } from "@/domains/apiKeys/queries";
import type { ApiKey, CreatedApiKey } from "@/domains/apiKeys/types";
import { ApiKeyCreateDialog } from "@/features/settings/pages/SettingsPage/components/ApiKeyCreateDialog";
import { ApiKeySecretDialog } from "@/features/settings/pages/SettingsPage/components/ApiKeySecretDialog";
import { ApiKeyTable } from "@/features/settings/pages/SettingsPage/components/ApiKeyTable";

export const ApiKeysTab: React.FC = () => {
  const t = useT();
  const onRevokeError = useApiErrorToast("settings.api_keys.revoke_error");

  const [sort, toggleSort] = useSortState<ApiKeySortField>({
    col: ApiKeySortField.Expires,
    dir: SortDirection.Asc,
  });

  const apiKeysQuery = useApiKeysQuery({
    sortBy: sort.col,
    sortDirection: sort.dir,
  });
  const keys = apiKeysQuery.data ?? [];
  const loading = apiKeysQuery.isLoading && !apiKeysQuery.data;
  const revokeKeyMutation = useRevokeApiKeyMutation();
  const revoking = revokeKeyMutation.isPending;

  const [createOpen, setCreateOpen] = useState(false);
  const [secretKey, setSecretKey] = useState<CreatedApiKey | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<ApiKey | null>(null);

  const handleCreated = (created: CreatedApiKey) => {
    setCreateOpen(false);
    setSecretKey(created);
  };

  const handleRevoke = () => {
    if (!revokeTarget) return;
    revokeKeyMutation.mutate(
      { id: revokeTarget.id },
      {
        onSuccess: () => setRevokeTarget(null),
        onError: onRevokeError,
      },
    );
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
          background: "var(--s1)",
          border: "1px solid var(--border)",
          borderRadius: "var(--r)",
        }}
      >
        {!loading && keys.length === 0 ? (
          <EmptyState
            icon={KeyOutlined}
            title={t("settings.api_keys.empty")}
            subtitle={t("settings.api_keys.empty_subtitle")}
            iconSize={40}
            sx={{ flex: 1, justifyContent: "center" }}
          />
        ) : (
          <ApiKeyTable
            keys={keys}
            fetching={apiKeysQuery.isFetching}
            sort={sort}
            onSort={toggleSort}
            onRevoke={setRevokeTarget}
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
        onClose={() => setRevokeTarget(null)}
        onConfirm={handleRevoke}
        loading={revoking}
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
