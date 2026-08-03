import type React from "react";
import { useId, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import KeyOutlined from "@mui/icons-material/KeyOutlined";
import DeleteOutlineOutlined from "@mui/icons-material/DeleteOutlineOutlined";
import ContentCopyOutlined from "@mui/icons-material/ContentCopyOutlined";
import WarningAmberOutlined from "@mui/icons-material/WarningAmberOutlined";
import CheckCircleOutlineOutlined from "@mui/icons-material/CheckCircleOutlineOutlined";
import { AppModal } from "@/components/ui/common/AppModal";
import { RowActions } from "@/components/ui/common/RowActions";
import { SortableTh } from "@/components/ui/common/SortableTh";
import { useToast } from "@/hooks/useToast";
import { useT, useI18n } from "@/contexts/I18nContext";
import { useApiError } from "@/hooks/useApiError";
import { ApiKeySortField, SortDirection } from "@/enums";
import {
  useCreateApiKeyMutation,
  useRevokeApiKeyMutation,
} from "@/domains/apiKeys/mutations";
import { useApiKeysQuery } from "@/domains/apiKeys/queries";
import type { ApiKey, CreatedApiKey } from "@/domains/apiKeys/types";
import {
  FieldLabel,
  inp,
} from "@/features/settings/pages/SettingsPage/helpers";
import {
  createApiKeySchema,
  type CreateApiKeyFormValues,
} from "@/features/settings/pages/SettingsPage/components/ApiKeysTab/schemas";
import { formatDate as fmtDate } from "@/formatters/date";

export const ApiKeysTab: React.FC = () => {
  const t = useT();
  const apiError = useApiError();
  const { culture } = useI18n();
  const { showToast } = useToast();
  const formId = useId();

  const [sort, setSort] = useState<{
    col: ApiKeySortField;
    dir: SortDirection;
  }>({
    col: ApiKeySortField.Expires,
    dir: SortDirection.Asc,
  });

  const toggleSort = (col: ApiKeySortField) => {
    setSort((s) =>
      s.col === col
        ? {
            col,
            dir:
              s.dir === SortDirection.Asc
                ? SortDirection.Desc
                : SortDirection.Asc,
          }
        : { col, dir: SortDirection.Asc },
    );
  };

  const apiKeysQuery = useApiKeysQuery({
    sortBy: sort.col,
    sortDirection: sort.dir,
  });
  const keys = apiKeysQuery.data ?? [];
  const loading = apiKeysQuery.isLoading && !apiKeysQuery.data;
  const createKeyMutation = useCreateApiKeyMutation();
  const revokeKeyMutation = useRevokeApiKeyMutation();
  const creating = createKeyMutation.isPending;
  const revoking = revokeKeyMutation.isPending;

  const [createOpen, setCreateOpen] = useState(false);
  const {
    register,
    handleSubmit: handleFormSubmit,
    reset,
    formState: { isValid },
  } = useForm<CreateApiKeyFormValues>({
    resolver: zodResolver(createApiKeySchema),
    mode: "onChange",
    defaultValues: { name: "", expiresAt: "" },
  });

  const [secretKey, setSecretKey] = useState<CreatedApiKey | null>(null);
  const [copied, setCopied] = useState(false);

  const [revokeTarget, setRevokeTarget] = useState<ApiKey | null>(null);

  const handleCreate = handleFormSubmit((data) => {
    createKeyMutation.mutate(
      { data: { name: data.name.trim(), expiresAt: data.expiresAt || null } },
      {
        onSuccess: (created) => {
          setCreateOpen(false);
          reset({ name: "", expiresAt: "" });
          setSecretKey(created);
        },
        onError: (err) =>
          showToast(
            apiError(err, t("settings.api_keys.create_error")),
            "error",
          ),
      },
    );
  });

  const handleRevoke = () => {
    if (!revokeTarget) return;
    revokeKeyMutation.mutate(
      { id: revokeTarget.id },
      {
        onSuccess: () => setRevokeTarget(null),
        onError: (err) =>
          showToast(
            apiError(err, t("settings.api_keys.revoke_error")),
            "error",
          ),
      },
    );
  };

  const handleCopy = async () => {
    if (!secretKey) return;
    await navigator.clipboard.writeText(secretKey.key);
    setCopied(true);
    setTimeout(() => {
      setSecretKey(null);
      setCopied(false);
    }, 1200);
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
        {loading ? (
          <Box
            sx={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CircularProgress size={20} />
          </Box>
        ) : keys.length === 0 ? (
          <Box
            className="empty-state"
            sx={{ flex: 1, justifyContent: "center" }}
          >
            <KeyOutlined className="empty-state-icon" sx={{ fontSize: 40 }} />
            <Box className="empty-state-title">
              {t("settings.api_keys.empty")}
            </Box>
            <Box className="empty-state-subtitle">
              {t("settings.api_keys.empty_subtitle")}
            </Box>
          </Box>
        ) : (
          <Box
            sx={{
              flex: 1,
              overflow: "auto",
              opacity: apiKeysQuery.isFetching ? 0.6 : 1,
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
                  {(
                    [
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
                    ] as const
                  ).map(({ col, key, label, width }) => {
                    const sortable = col !== "actions";
                    return (
                      <SortableTh
                        key={key}
                        width={width}
                        sortable={sortable}
                        active={sort.col === col}
                        ascending={sort.dir === SortDirection.Asc}
                        onSort={() => sortable && toggleSort(col)}
                      >
                        {label}
                      </SortableTh>
                    );
                  })}
                </Box>
              </Box>
              <Box component="tbody">
                {keys.map((key) => (
                  <Box
                    component="tr"
                    key={key.id}
                    sx={{
                      borderBottom: "1px solid var(--border)",
                      "&:last-child": { borderBottom: "none" },
                      "&:hover": { background: "var(--s2)" },
                      "&:hover .row-actions": { opacity: "1 !important" },
                      transition: "background 0.1s",
                    }}
                  >
                    <Box
                      component="td"
                      sx={{
                        px: "16px",
                        py: "10px",
                        fontWeight: 500,
                        color: "var(--text)",
                      }}
                    >
                      {key.name}
                    </Box>
                    <Box component="td" sx={{ px: "16px", py: "10px" }}>
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
                        {key.prefix}…
                      </Box>
                    </Box>
                    <Box
                      component="td"
                      sx={{
                        px: "16px",
                        py: "10px",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {key.createdByName}
                    </Box>
                    <Box
                      component="td"
                      sx={{
                        px: "16px",
                        py: "10px",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {fmtDate(key.createdAt, culture)}
                    </Box>
                    <Box component="td" sx={{ px: "16px", py: "10px" }}>
                      {(() => {
                        if (!key.expiresAt)
                          return (
                            <Box
                              component="span"
                              sx={{ color: "var(--muted)" }}
                            >
                              {t("settings.api_keys.no_expiry")}
                            </Box>
                          );
                        const expired =
                          new Date(key.expiresAt).getTime() < Date.now();
                        return (
                          <Box
                            component="span"
                            sx={{
                              color: expired
                                ? "var(--red)"
                                : "var(--text-secondary)",
                              fontWeight: expired ? 600 : 400,
                            }}
                          >
                            {fmtDate(key.expiresAt, culture)}
                          </Box>
                        );
                      })()}
                    </Box>
                    <Box
                      component="td"
                      sx={{
                        px: "16px",
                        py: "10px",
                        color: key.lastUsedAt
                          ? "var(--text-secondary)"
                          : "var(--muted)",
                        fontSize: "11px",
                      }}
                    >
                      {key.lastUsedAt
                        ? fmtDate(key.lastUsedAt, culture)
                        : t("settings.api_keys.never_used")}
                    </Box>
                    <Box
                      component="td"
                      sx={{ px: "16px", py: "10px", textAlign: "right" }}
                    >
                      <RowActions
                        actions={[
                          {
                            icon: (
                              <DeleteOutlineOutlined sx={{ fontSize: 13 }} />
                            ),
                            label: t("settings.api_keys.revoke"),
                            onClick: () => setRevokeTarget(key),
                            color: "red",
                          },
                        ]}
                      />
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        )}
      </Box>

      {/* Modal — Créer */}
      <AppModal
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          reset({ name: "", expiresAt: "" });
        }}
        title={t("settings.api_keys.modal_title")}
        maxWidth="xs"
        actions={
          <>
            <Button
              variant="contained"
              size="small"
              className="btn-cancel"
              onClick={() => {
                setCreateOpen(false);
                reset({ name: "", expiresAt: "" });
              }}
            >
              {t("settings.api_keys.modal_cancel")}
            </Button>
            <Button
              variant="contained"
              size="small"
              type="submit"
              form={formId}
              disabled={creating || !isValid}
            >
              {creating
                ? t("settings.api_keys.modal_creating")
                : t("settings.api_keys.modal_create")}
            </Button>
          </>
        }
      >
        <Box
          component="form"
          id={formId}
          onSubmit={handleCreate}
          noValidate
          sx={{ display: "flex", flexDirection: "column", gap: "16px" }}
        >
          <Box>
            <FieldLabel>{t("settings.api_keys.modal_name_label")}</FieldLabel>
            <Box
              component="input"
              autoFocus
              placeholder={t("settings.api_keys.modal_name_placeholder")}
              sx={inp}
              {...register("name")}
            />
          </Box>
          <Box>
            <FieldLabel>
              {t("settings.api_keys.modal_expires_label")}
            </FieldLabel>
            <Box
              component="input"
              type="date"
              min={new Date().toISOString().split("T")[0]}
              sx={{ ...inp, colorScheme: "dark" }}
              {...register("expiresAt")}
            />
          </Box>
        </Box>
      </AppModal>

      {/* Modal — Affichage secret */}
      <AppModal
        open={secretKey !== null}
        onClose={() => {
          setSecretKey(null);
          setCopied(false);
        }}
        title={t("settings.api_keys.secret_title")}
        maxWidth="sm"
        actions={
          <Button
            variant="contained"
            size="small"
            onClick={
              copied
                ? () => {
                    setSecretKey(null);
                    setCopied(false);
                  }
                : handleCopy
            }
            startIcon={
              copied ? (
                <CheckCircleOutlineOutlined
                  sx={{ fontSize: "13px !important" }}
                />
              ) : (
                <ContentCopyOutlined sx={{ fontSize: "13px !important" }} />
              )
            }
            sx={
              copied
                ? {
                    background:
                      "linear-gradient(135deg, var(--green) 0%, color-mix(in srgb, var(--green) 85%, black) 100%)",
                    "&:hover": { background: "var(--green)" },
                  }
                : undefined
            }
          >
            {copied
              ? t("settings.api_keys.secret_close")
              : t("settings.api_keys.secret_copy")}
          </Button>
        }
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "color-mix(in srgb, var(--orange) 10%, transparent)",
              border:
                "1px solid color-mix(in srgb, var(--orange) 30%, transparent)",
              borderRadius: "var(--r-sm)",
              p: "10px 14px",
            }}
          >
            <WarningAmberOutlined
              sx={{ fontSize: 14, color: "var(--orange)", flexShrink: 0 }}
            />
            <Box
              sx={{ fontSize: "12px", color: "var(--orange)", fontWeight: 500 }}
            >
              {t("settings.api_keys.secret_warning")}
            </Box>
          </Box>

          <Box
            sx={{
              background: "var(--s3)",
              border: "1px solid var(--border)",
              borderRadius: "var(--r-sm)",
              p: "14px 16px",
              fontSize: "13px",
              fontFamily: "monospace",
              color: "var(--text)",
              letterSpacing: "0.04em",
            }}
          >
            {secretKey ? `${secretKey.key.slice(0, 16)}${"•".repeat(20)}` : ""}
          </Box>
        </Box>
      </AppModal>

      {/* Modal — Confirmation révocation */}
      <AppModal
        open={revokeTarget !== null}
        onClose={() => setRevokeTarget(null)}
        title={t("settings.api_keys.revoke")}
        maxWidth="xs"
        actions={
          <>
            <Button
              variant="contained"
              size="small"
              className="btn-cancel"
              onClick={() => setRevokeTarget(null)}
              disabled={revoking}
            >
              {t("settings.api_keys.revoke_confirm_no")}
            </Button>
            <Button
              variant="contained"
              color="error"
              size="small"
              disabled={revoking}
              onClick={handleRevoke}
            >
              {revoking ? "…" : t("settings.api_keys.revoke_confirm_yes")}
            </Button>
          </>
        }
      >
        <Box sx={{ fontSize: "13px", color: "var(--text-secondary)" }}>
          {t("settings.api_keys.revoke_confirm")}
          {revokeTarget && (
            <Box
              component="span"
              sx={{ fontWeight: 600, color: "var(--text)" }}
            >
              {" "}
              {revokeTarget.name}
            </Box>
          )}
        </Box>
      </AppModal>
    </>
  );
};
