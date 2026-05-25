import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import { verifyEmail } from "../api/auth";
import { SentinelLogo } from "../../../layouts/SentinelLogo";
import { useT } from "../../../i18n/I18nContext";

type Status = "loading" | "success" | "error";

export const VerifyEmailPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const t = useT();
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      return;
    }
    verifyEmail(token)
      .then(() => setStatus("success"))
      .catch(() => setStatus("error"));
  }, [searchParams]);

  return (
    <Box className="lp-root">
      <Box className="lp-card">
        <Box className="lp-right" sx={{ width: "100%" }}>
          <Box className="lp-form-wrap">
            <Box className="lp-logo" sx={{ marginBottom: "32px" }}>
              <Box className="lp-logo-mark">
                <SentinelLogo width={20} height={23} />
              </Box>
              <Box className="lp-logo-wordmark" sx={{ color: "var(--text)" }}>
                {t("auth.verify_email.brand")}
              </Box>
            </Box>

            {status === "loading" && (
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", py: "40px" }}>
                <CircularProgress size={28} />
                <Box component="p" className="lp-form-sub">
                  {t("auth.verify_email.loading")}
                </Box>
              </Box>
            )}

            {status === "success" && (
              <Box className="aip-success">
                <Box className="aip-success-icon">
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <path d="M6 14l6 6 10-10" stroke="#6366f1" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Box>
                <Box component="p" className="aip-success-title">
                  {t("auth.verify_email.success_title")}
                </Box>
                <Box component="p" className="aip-success-sub">
                  {t("auth.verify_email.success_sub")}
                </Box>
                <button type="button" className="lp-submit" style={{ marginTop: "24px" }} onClick={() => navigate("/login")}>
                  {t("auth.verify_email.go_to_login")}
                </button>
              </Box>
            )}

            {status === "error" && (
              <Box className="aip-success">
                <Box className="aip-success-icon" sx={{ background: "rgba(220,38,38,0.1) !important" }}>
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <path d="M9 9l10 10M19 9L9 19" stroke="#dc2626" strokeWidth="2.4" strokeLinecap="round" />
                  </svg>
                </Box>
                <Box component="p" className="aip-success-title">
                  {t("auth.verify_email.error_title")}
                </Box>
                <Box component="p" className="aip-success-sub">
                  {t("auth.verify_email.error_sub")}
                </Box>
                <button type="button" className="lp-submit" style={{ marginTop: "24px" }} onClick={() => navigate("/login")}>
                  {t("auth.verify_email.go_to_login")}
                </button>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
