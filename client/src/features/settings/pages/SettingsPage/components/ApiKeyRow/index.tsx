import type React from "react";
import Box from "@mui/material/Box";
import DeleteOutlineOutlined from "@mui/icons-material/DeleteOutlineOutlined";
import { RowActions } from "@/components/ui/common/RowActions";
import { useT, useI18n } from "@/contexts/I18nContext";
import type { ApiKey } from "@/domains/apiKeys/types";
import { formatDate as fmtDate } from "@/formatters/date";

interface Props {
  apiKey: ApiKey;
  onRevoke: (apiKey: ApiKey) => void;
}

export const ApiKeyRow: React.FC<Props> = ({ apiKey, onRevoke }) => {
  const t = useT();
  const { culture } = useI18n();

  const renderExpiry = () => {
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

  return (
    <Box
      component="tr"
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
          py: "8px",
          fontWeight: 500,
          color: "var(--text)",
        }}
      >
        {apiKey.name}
      </Box>
      <Box component="td" sx={{ px: "16px", py: "8px" }}>
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
      <Box
        component="td"
        sx={{
          px: "16px",
          py: "8px",
          color: "var(--text-secondary)",
        }}
      >
        {apiKey.createdByName}
      </Box>
      <Box
        component="td"
        sx={{
          px: "16px",
          py: "8px",
          color: "var(--text-secondary)",
        }}
      >
        {fmtDate(apiKey.createdAt, culture)}
      </Box>
      <Box component="td" sx={{ px: "16px", py: "8px" }}>
        {renderExpiry()}
      </Box>
      <Box
        component="td"
        sx={{
          px: "16px",
          py: "8px",
          color: apiKey.lastUsedAt ? "var(--text-secondary)" : "var(--muted)",
          fontSize: "11px",
        }}
      >
        {apiKey.lastUsedAt
          ? fmtDate(apiKey.lastUsedAt, culture)
          : t("settings.api_keys.never_used")}
      </Box>
      <Box component="td" sx={{ px: "16px", py: "8px", textAlign: "right" }}>
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
  );
};
