import React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CheckCircleOutlineOutlined from "@mui/icons-material/CheckCircleOutlineOutlined";
import InfoOutlined from "@mui/icons-material/InfoOutlined";
import { useT } from "@/i18n/I18nContext";
import { inp } from "../../helpers";

interface Props {
  iconBackground: string;
  iconBorder?: string;
  icon: React.ReactNode;
  name: string;
  isConnected: boolean;
  connectedLabel: string;
  helpInstructions: string;
  helpScopes: string[];
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
  helpInstructions,
  helpScopes,
  placeholder,
  token,
  onTokenChange,
  onConnect,
  connecting,
}) => {
  const t = useT();
  return (
    <Box sx={{ background: "var(--s1)", display: "flex", flexDirection: "column" }}>
      <Box
        sx={{
          px: "16px",
          py: "14px",
          display: "flex",
          alignItems: "center",
          gap: "14px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
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
          <Box sx={{ display: "flex", alignItems: "center", gap: "6px", mb: "2px" }}>
            <Box sx={{ fontSize: "14px", fontWeight: 700, color: "var(--text)" }}>
              {name}
            </Box>
            {isConnected && (
              <CheckCircleOutlineOutlined sx={{ fontSize: 13, color: "var(--green)" }} />
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
            {isConnected ? connectedLabel : t("settings.integrations.not_configured")}
          </Box>
        </Box>
      </Box>

      <Box sx={{ px: "16px", pt: "12px", pb: "14px", display: "flex", flexDirection: "column", gap: "12px" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <InfoOutlined sx={{ fontSize: 13, color: "var(--muted)", flexShrink: 0 }} />
          <Box sx={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.5 }}>
            {helpInstructions}
          </Box>
          <Box sx={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
            {helpScopes.map((scope, i) => (
              <React.Fragment key={scope}>
                <Box
                  component="code"
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    px: "7px",
                    py: "2px",
                    borderRadius: "6px",
                    background: "color-mix(in srgb, var(--accent) 12%, var(--s2))",
                    border: "1px solid color-mix(in srgb, var(--accent) 25%, transparent)",
                    color: "var(--accent)",
                    fontSize: "11px",
                    fontFamily: "monospace",
                    fontWeight: 500,
                    letterSpacing: "0.01em",
                  }}
                >
                  {scope}
                </Box>
                {i < helpScopes.length - 1 && (
                  <Box
                    component="span"
                    sx={{ fontSize: "11px", color: "var(--muted)", alignSelf: "center" }}
                  >
                    et
                  </Box>
                )}
              </React.Fragment>
            ))}
          </Box>
        </Box>

        <Box sx={{ display: "flex", gap: "8px" }}>
          <Box
            component="input"
            type="password"
            placeholder={placeholder}
            sx={{ ...inp, flex: 1, minWidth: 0 }}
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
              minWidth: "110px",
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
    </Box>
  );
};
