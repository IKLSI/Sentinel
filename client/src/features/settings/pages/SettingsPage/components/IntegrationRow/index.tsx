import React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import OutlinedInput from "@mui/material/OutlinedInput";
import CheckCircleOutlineOutlined from "@mui/icons-material/CheckCircleOutlineOutlined";
import InfoOutlined from "@mui/icons-material/InfoOutlined";
import { useT } from "@/contexts/I18nContext";
import { FormField } from "@/components/ui/forms/FormField";

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
  tokenLabel?: string;
  token: string;
  onTokenChange: (value: string) => void;
  onConnect: () => void;
  connecting: boolean;
  children?: React.ReactNode;
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
  tokenLabel,
  token,
  onTokenChange,
  onConnect,
  connecting,
  children,
}) => {
  const t = useT();
  const tokenId = React.useId();
  return (
    <Box
      sx={{ background: "var(--s1)", display: "flex", flexDirection: "column" }}
    >
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
            borderRadius: "var(--r)",
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
              sx={{ fontSize: "14px", fontWeight: 700, color: "var(--text)" }}
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
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flexWrap: "wrap",
            }}
          >
            <InfoOutlined
              sx={{ fontSize: 13, color: "var(--muted)", flexShrink: 0 }}
            />
            <Box
              sx={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.5 }}
            >
              {isConnected ? connectedLabel : helpInstructions}
            </Box>
            {!isConnected && (
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
                        borderRadius: "var(--r-sm)",
                        background:
                          "color-mix(in srgb, var(--accent) 12%, var(--s2))",
                        border:
                          "1px solid color-mix(in srgb, var(--accent) 25%, transparent)",
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
                        sx={{
                          fontSize: "11px",
                          color: "var(--muted)",
                          alignSelf: "center",
                        }}
                      >
                        {t("common.and")}
                      </Box>
                    )}
                  </React.Fragment>
                ))}
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      <Box
        sx={{
          px: "16px",
          pt: "12px",
          pb: "14px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "flex-end",
          gap: "12px",
        }}
      >
        {children && (
          <Box sx={{ flex: "1 1 240px", minWidth: 0 }}>{children}</Box>
        )}
        <FormField
          id={tokenId}
          label={tokenLabel}
          sx={{ flex: "1 1 320px", minWidth: 0 }}
        >
          <Box sx={{ display: "flex", gap: "8px" }}>
            <OutlinedInput
              id={tokenId}
              type="password"
              size="small"
              placeholder={placeholder}
              inputProps={{ "aria-label": tokenLabel ?? placeholder ?? name }}
              value={token}
              onChange={(e) => onTokenChange(e.target.value)}
              sx={{ flex: 1, minWidth: 0 }}
            />
            <Button
              variant="contained"
              size="small"
              onClick={onConnect}
              disabled={connecting || !token.trim()}
              sx={{ flexShrink: 0, minWidth: "110px" }}
            >
              {connecting
                ? t("settings.integrations.importing")
                : t("settings.integrations.connect")}
            </Button>
          </Box>
        </FormField>
      </Box>
    </Box>
  );
};
