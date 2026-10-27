import type React from "react";
import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ContentCopyOutlined from "@mui/icons-material/ContentCopyOutlined";
import WarningAmberOutlined from "@mui/icons-material/WarningAmberOutlined";
import CheckCircleOutlineOutlined from "@mui/icons-material/CheckCircleOutlineOutlined";
import { AppModal } from "@/components/ui/common/modal/AppModal";
import { useT } from "@/contexts/I18nContext";
import type { CreatedApiKey } from "@/domains/apiKeys/types";

interface Props {
  secretKey: CreatedApiKey | null;
  onClose: () => void;
}

export const ApiKeySecretDialog: React.FC<Props> = ({ secretKey, onClose }) => {
  const t = useT();
  const [copied, setCopied] = useState(false);

  const handleClose = () => {
    onClose();
    setCopied(false);
  };

  const handleCopy = async () => {
    if (!secretKey) return;
    await navigator.clipboard.writeText(secretKey.key);
    setCopied(true);
    setTimeout(handleClose, 1200);
  };

  return (
    <AppModal
      open={secretKey !== null}
      onClose={handleClose}
      title={t("settings.api_keys.secret_title")}
      maxWidth="sm"
      actions={
        <Button
          variant="contained"
          size="small"
          onClick={copied ? handleClose : handleCopy}
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
                  background: "var(--green-fill)",
                  "&:hover": {
                    background:
                      "color-mix(in srgb, var(--green-fill) 88%, white)",
                  },
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
            fontFamily: "var(--font-mono)",
            color: "var(--text)",
            letterSpacing: "0.04em",
          }}
        >
          {secretKey ? `${secretKey.key.slice(0, 16)}${"•".repeat(20)}` : ""}
        </Box>
      </Box>
    </AppModal>
  );
};
