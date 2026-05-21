import React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { useNavigate } from "react-router-dom";
import { useT } from "../i18n/I18nContext";

interface ErrorPageProps {
  status?: number;
  message?: string;
  onRetry?: () => void;
}

export const ErrorPage: React.FC<ErrorPageProps> = ({ status = 500, message, onRetry }) => {
  const navigate = useNavigate();
  const t = useT();

  const is404 = status === 404;
  const defaultMessage = t(is404 ? "error.404.title" : "error.500.title");
  const subtitle = t(is404 ? "error.404.subtitle" : "error.500.subtitle");

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        gap: "12px",
        bgcolor: "background.default",
      }}
    >
      <Box
        sx={{
          fontSize: "64px",
          fontWeight: 800,
          color: "var(--border2)",
          fontFamily: "var(--font-mono)",
          lineHeight: 1,
        }}
      >
        {status}
      </Box>
      <Box sx={{ fontSize: "15px", fontWeight: 600, color: "var(--text)" }}>
        {message ?? defaultMessage}
      </Box>
      <Box sx={{ fontSize: "13px", color: "var(--muted)", mb: "8px" }}>
        {subtitle}
      </Box>
      <Box sx={{ display: "flex", gap: "8px" }}>
        {onRetry && (
          <Button variant="outlined" size="small" onClick={onRetry}>
            {t("error.retry")}
          </Button>
        )}
        <Button variant="contained" size="small" onClick={() => navigate("/")}>
          {t("error.back_home")}
        </Button>
      </Box>
    </Box>
  );
};
