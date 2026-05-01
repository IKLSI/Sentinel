import React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CheckCircleOutlineOutlined from "@mui/icons-material/CheckCircleOutlineOutlined";
import { useT } from "@/i18n/I18nContext";
import { inp } from "../../helpers";

interface Props {
  iconBackground: string;
  iconBorder?: string;
  icon: React.ReactNode;
  name: string;
  isConnected: boolean;
  connectedLabel: string;
  helpLabel: string;
  placeholder: string;
  token: string;
  onTokenChange: (value: string) => void;
  onConnect: () => void;
  connecting: boolean;
}

export const IntegrationRow: React.FC<Props> = ({
  iconBackground,
  iconBorder,
  icon,
  name,
  isConnected,
  connectedLabel,
  helpLabel,
  placeholder,
  token,
  onTokenChange,
  onConnect,
  connecting,
}) => {
  const t = useT();
  return (
    <Box
      sx={{
        background: "var(--s1)",
        px: "16px",
        py: "14px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: "14px" }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: "10px",
            flexShrink: 0,
            background: iconBackground,
            border: iconBorder ?? "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {icon}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              mb: "2px",
            }}
          >
            <Box
              sx={{ fontSize: "13px", fontWeight: 700, color: "var(--text)" }}
            >
              {name}
            </Box>
            {isConnected && (
              <CheckCircleOutlineOutlined
                sx={{ fontSize: 13, color: "var(--green)" }}
              />
            )}
          </Box>
          <Box
            sx={{
              fontSize: "11px",
              color: "var(--muted)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {isConnected ? connectedLabel : helpLabel}
          </Box>
        </Box>
      </Box>
      <Box sx={{ display: "flex", gap: "8px", flexShrink: 0 }}>
        <Box
          component="input"
          type="password"
          placeholder={placeholder}
          sx={{ ...inp, width: "180px", flex: 1, minWidth: 0 }}
          value={token}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onTokenChange(e.target.value)
          }
        />
        <Button
          variant="contained"
          size="small"
          disableElevation
          onClick={onConnect}
          disabled={connecting || !token.trim()}
          sx={{
            flexShrink: 0,
            textTransform: "none",
            background:
              "linear-gradient(135deg, var(--accent) 0%, color-mix(in srgb, var(--accent) 92%, white) 100%)",
            color: "#fff",
            boxShadow: "none",
            "&:hover": {
              background:
                "linear-gradient(135deg, color-mix(in srgb, var(--accent) 85%, black) 0%, var(--accent) 100%)",
              boxShadow: "none",
              transform: "none",
            },
            "&:active": { boxShadow: "none" },
          }}
        >
          {connecting
            ? t("settings.integrations.importing")
            : t("settings.integrations.connect")}
        </Button>
      </Box>
    </Box>
  );
};
