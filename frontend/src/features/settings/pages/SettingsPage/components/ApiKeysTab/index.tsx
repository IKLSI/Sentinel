import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import KeyOutlined from "@mui/icons-material/KeyOutlined";
import DeleteOutlineOutlined from "@mui/icons-material/DeleteOutlineOutlined";
import ContentCopyOutlined from "@mui/icons-material/ContentCopyOutlined";
import WarningAmberOutlined from "@mui/icons-material/WarningAmberOutlined";
import CheckCircleOutlineOutlined from "@mui/icons-material/CheckCircleOutlineOutlined";
import { AppModal } from "@/components/AppModal";
import { RowActions } from "@/components/RowActions";
import { useToast } from "@/hooks/useToast";
import { useT, useI18n } from "@/i18n/I18nContext";
import { extractApiError } from "@/utils/apiError";
import { ApiKey, CreatedApiKey, createApiKey, listApiKeys, revokeApiKey } from "@/features/settings/api/apiKeys";
import { FieldLabel, inp } from "../../helpers";

const BTN_SX = {
  textTransform: "none" as const,
  background: "linear-gradient(135deg, var(--accent) 0%, color-mix(in srgb, var(--accent) 92%, white) 100%)",
  color: "#fff",
  boxShadow: "none",
  "&:hover": {
    background: "linear-gradient(135deg, color-mix(in srgb, var(--accent) 85%, black) 0%, var(--accent) 100%)",
    boxShadow: "none",
    transform: "none",
  },
  "&:active": { boxShadow: "none" },
};

function fmtDate(iso: string | null, locale: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export const ApiKeysTab: React.FC = () => {
  const t = useT();
  const { culture } = useI18n();
  const { showToast } = useToast();

  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [creating, setCreating] = useState(false);

  const [secretKey, setSecretKey] = useState<CreatedApiKey | null>(null);
  const [copied, setCopied] = useState(false);

  const [revokeTarget, setRevokeTarget] = useState<ApiKey | null>(null);
  const [revoking, setRevoking] = useState(false);

  const [sort, setSort] = useState<{ col: string; dir: "asc" | "desc" } | null>({
    col: "expires",
    dir: "asc",
  });

  const toggleSort = useCallback((col: string) => {
    setSort((s) => {
      if (s?.col !== col) return { col, dir: "asc" };
      if (s.dir === "asc") return { col, dir: "desc" };
      return null;
    });
  }, []);

  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback((signal?: AbortSignal) => {
    setLoading(true);
    listApiKeys(signal)
      .then(setKeys)
      .catch((err) => {
        if ((err as { name?: string }).name !== "CanceledError")
          showToast(extractApiError(err, t("settings.api_keys.load_error")), "error");
      })
      .finally(() => setLoading(false));
  }, [showToast, t]);

  useEffect(() => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    load(abortRef.current.signal);
    return () => abortRef.current?.abort();
  }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      const created = await createApiKey({ name: name.trim(), expiresAt: expiresAt || null });
      setCreateOpen(false);
      setName("");
      setExpiresAt("");
      setSecretKey(created);
      load();
    } catch (err) {
      showToast(extractApiError(err, t("settings.api_keys.create_error")), "error");
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    setRevoking(true);
    try {
      await revokeApiKey(revokeTarget.id);
      setKeys((prev) => prev.filter((k) => k.id !== revokeTarget.id));
      setRevokeTarget(null);
    } catch (err) {
      showToast(extractApiError(err, t("settings.api_keys.revoke_error")), "error");
    } finally {
      setRevoking(false);
    }
  };

  const sortedKeys = useMemo(() => {
    if (!sort) return keys;
    const mul = sort.dir === "asc" ? 1 : -1;
    return keys.slice().sort((a, b) => {
      switch (sort.col) {
        case "name":
          return mul * a.name.localeCompare(b.name);
        case "prefix":
          return mul * a.prefix.localeCompare(b.prefix);
        case "created_by":
          return mul * a.createdByName.localeCompare(b.createdByName);
        case "created":
          return (
            mul *
            (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
          );
        case "expires":
          return (
            mul *
            ((a.expiresAt ? new Date(a.expiresAt).getTime() : Infinity) -
              (b.expiresAt ? new Date(b.expiresAt).getTime() : Infinity))
          );
        case "last_used":
          return (
            mul *
            ((a.lastUsedAt ? new Date(a.lastUsedAt).getTime() : 0) -
              (b.lastUsedAt ? new Date(b.lastUsedAt).getTime() : 0))
          );
        default:
          return 0;
      }
    });
  }, [keys, sort]);

  const handleCopy = async () => {
    if (!secretKey) return;
    await navigator.clipboard.writeText(secretKey.key);
    setCopied(true);
    setTimeout(() => { setSecretKey(null); setCopied(false); }, 1200);
  };

  return (
    <>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", mb: "12px", flexShrink: 0 }}>
        <Button
          variant="contained"
          size="small"
          disableElevation
          startIcon={<KeyOutlined sx={{ fontSize: "13px !important" }} />}
          onClick={() => setCreateOpen(true)}
          sx={{ ...BTN_SX, height: "34px", px: "16px", fontWeight: 600 }}
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
          <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CircularProgress size={20} />
          </Box>
        ) : keys.length === 0 ? (
          <Box className="empty-state" sx={{ flex: 1, justifyContent: "center" }}>
            <KeyOutlined className="empty-state-icon" sx={{ fontSize: 40 }} />
            <Box className="empty-state-title">{t("settings.api_keys.empty")}</Box>
            <Box className="empty-state-subtitle">{t("settings.api_keys.empty_subtitle")}</Box>
          </Box>
        ) : (
          <Box sx={{ flex: 1, overflow: "auto" }}>
            <Box
              component="table"
              sx={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}
            >
                  <Box component="thead">
                    <Box
                      component="tr"
                      sx={{ borderBottom: "1px solid var(--border)", background: "var(--s2)" }}
                    >
                      {[
                        { key: "name",       label: t("settings.api_keys.col_name"),       width: "auto" },
                        { key: "prefix",     label: t("settings.api_keys.col_prefix"),     width: "130px" },
                        { key: "created_by", label: t("settings.api_keys.col_created_by"), width: "160px" },
                        { key: "created",    label: t("settings.api_keys.col_created"),    width: "120px" },
                        { key: "expires",    label: t("settings.api_keys.col_expires"),    width: "120px" },
                        { key: "last_used",  label: t("settings.api_keys.col_last_used"),  width: "200px" },
                        { key: "actions",    label: "",                                    width: "48px"  },
                      ].map(({ key, label, width }) => {
                        const sortable = key !== "actions";
                        const isActive = sort?.col === key;
                        return (
                          <Box
                            component="th"
                            key={key}
                            onClick={() => sortable && toggleSort(key)}
                            sx={{
                              px: "16px", py: "10px",
                              textAlign: "left",
                              fontSize: "10px", fontWeight: 700,
                              color: isActive ? "var(--accent)" : "var(--muted)",
                              letterSpacing: "0.08em",
                              textTransform: "uppercase",
                              whiteSpace: "nowrap",
                              width,
                              cursor: sortable ? "pointer" : "default",
                              userSelect: "none",
                              transition: "color 0.12s",
                              "&:hover": sortable
                                ? { color: "var(--text-secondary)" }
                                : {},
                            }}
                          >
                            <Box sx={{ display: "flex", alignItems: "center", gap: "5px" }}>
                              {label}
                              {sortable && isActive && (
                                <Box
                                  sx={{
                                    fontSize: "12px",
                                    color: "var(--accent)",
                                    lineHeight: 1,
                                    display: "flex",
                                    alignItems: "center",
                                  }}
                                >
                                  {sort?.dir === "asc" ? "↑" : "↓"}
                                </Box>
                              )}
                            </Box>
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>
                  <Box component="tbody">
                    {sortedKeys.map((key) => (
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
                        <Box component="td" sx={{ px: "16px", py: "10px", fontWeight: 500, color: "var(--text)" }}>
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
                        <Box component="td" sx={{ px: "16px", py: "10px", color: "var(--text-secondary)" }}>
                          {key.createdByName}
                        </Box>
                        <Box component="td" sx={{ px: "16px", py: "10px", color: "var(--text-secondary)" }}>
                          {fmtDate(key.createdAt, culture)}
                        </Box>
                        <Box component="td" sx={{ px: "16px", py: "10px" }}>
                          {(() => {
                            if (!key.expiresAt)
                              return <Box component="span" sx={{ color: "var(--muted)" }}>{t("settings.api_keys.no_expiry")}</Box>;
                            const expired = new Date(key.expiresAt).getTime() < Date.now();
                            return (
                              <Box component="span" sx={{ color: expired ? "var(--red)" : "var(--text-secondary)", fontWeight: expired ? 600 : 400 }}>
                                {fmtDate(key.expiresAt, culture)}
                              </Box>
                            );
                          })()}
                        </Box>
                        <Box component="td" sx={{ px: "16px", py: "10px", color: key.lastUsedAt ? "var(--text-secondary)" : "var(--muted)", fontSize: "11px" }}>
                          {key.lastUsedAt ? fmtDate(key.lastUsedAt, culture) : t("settings.api_keys.never_used")}
                        </Box>
                        <Box component="td" sx={{ px: "16px", py: "10px", textAlign: "right" }}>
                          <RowActions
                            actions={[
                              {
                                icon: <DeleteOutlineOutlined sx={{ fontSize: 13 }} />,
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
        onClose={() => { setCreateOpen(false); setName(""); setExpiresAt(""); }}
        title={t("settings.api_keys.modal_title")}
        maxWidth="xs"
        actions={
          <>
            <Button
              variant="contained"
              size="small"
              className="btn-cancel"
              onClick={() => { setCreateOpen(false); setName(""); setExpiresAt(""); }}
            >
              {t("settings.api_keys.modal_cancel")}
            </Button>
            <Button
              variant="contained"
              size="small"
              type="submit"
              form="api-key-form"
              disabled={creating || !name.trim()}
              sx={BTN_SX}
            >
              {creating ? t("settings.api_keys.modal_creating") : t("settings.api_keys.modal_create")}
            </Button>
          </>
        }
      >
        <Box
          component="form"
          id="api-key-form"
          onSubmit={handleCreate}
          sx={{ display: "flex", flexDirection: "column", gap: "16px" }}
        >
          <Box>
            <FieldLabel>{t("settings.api_keys.modal_name_label")}</FieldLabel>
            <Box
              component="input"
              autoFocus
              value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
              placeholder={t("settings.api_keys.modal_name_placeholder")}
              sx={inp}
            />
          </Box>
          <Box>
            <FieldLabel>{t("settings.api_keys.modal_expires_label")}</FieldLabel>
            <Box
              component="input"
              type="date"
              value={expiresAt}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setExpiresAt(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              sx={{ ...inp, colorScheme: "dark" }}
            />
          </Box>
        </Box>
      </AppModal>

      {/* Modal — Affichage secret */}
      <AppModal
        open={secretKey !== null}
        onClose={() => { setSecretKey(null); setCopied(false); }}
        title={t("settings.api_keys.secret_title")}
        maxWidth="sm"
        actions={
          <Button
            variant="contained"
            size="small"
            disableElevation
            onClick={copied ? () => { setSecretKey(null); setCopied(false); } : handleCopy}
            startIcon={copied
              ? <CheckCircleOutlineOutlined sx={{ fontSize: "13px !important" }} />
              : <ContentCopyOutlined sx={{ fontSize: "13px !important" }} />
            }
            sx={{
              ...BTN_SX,
              background: copied
                ? "linear-gradient(135deg, var(--green) 0%, color-mix(in srgb, var(--green) 85%, black) 100%)"
                : BTN_SX.background,
              "&:hover": copied
                ? { background: "var(--green)", boxShadow: "none", transform: "none" }
                : BTN_SX["&:hover"],
            }}
          >
            {copied ? t("settings.api_keys.secret_close") : t("settings.api_keys.secret_copy")}
          </Button>
        }
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <Box sx={{
            display: "flex", alignItems: "center", gap: "8px",
            background: "color-mix(in srgb, var(--orange) 10%, transparent)",
            border: "1px solid color-mix(in srgb, var(--orange) 30%, transparent)",
            borderRadius: "var(--r-sm)",
            p: "10px 14px",
          }}>
            <WarningAmberOutlined sx={{ fontSize: 14, color: "var(--orange)", flexShrink: 0 }} />
            <Box sx={{ fontSize: "12px", color: "var(--orange)", fontWeight: 500 }}>
              {t("settings.api_keys.secret_warning")}
            </Box>
          </Box>

          <Box sx={{
            background: "var(--s3)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-sm)",
            p: "14px 16px",
            fontSize: "13px",
            fontFamily: "monospace",
            color: "var(--text)",
            letterSpacing: "0.04em",
          }}>
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
              size="small"
              disabled={revoking}
              onClick={handleRevoke}
              sx={{
                textTransform: "none",
                background: "linear-gradient(135deg, var(--red) 0%, color-mix(in srgb, var(--red) 85%, black) 100%)",
                color: "#fff",
                boxShadow: "none",
                "&:hover": { background: "var(--red)", boxShadow: "none", transform: "none" },
                "&:active": { boxShadow: "none" },
              }}
            >
              {revoking ? "…" : t("settings.api_keys.revoke_confirm_yes")}
            </Button>
          </>
        }
      >
        <Box sx={{ fontSize: "13px", color: "var(--text-secondary)" }}>
          {t("settings.api_keys.revoke_confirm")}
          {revokeTarget && (
            <Box component="span" sx={{ fontWeight: 600, color: "var(--text)" }}>
              {" "}{revokeTarget.name}
            </Box>
          )}
        </Box>
      </AppModal>
    </>
  );
};
