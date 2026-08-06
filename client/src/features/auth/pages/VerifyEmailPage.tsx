import type React from "react";
import { useEffect, useState } from "react";
import { getRouteApi } from "@tanstack/react-router";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import { useVerifyEmailMutation } from "@/domains/auth/mutations";
import { SentinelLogo } from "@/components/layout/SentinelLogo";
import { useT } from "@/contexts/I18nContext";
import { ROUTES } from "@/constants/routes";

type Status = "loading" | "success" | "error";

const routeApi = getRouteApi("/verify-email");

export const VerifyEmailPage: React.FC = () => {
  const navigate = routeApi.useNavigate();
  const { token } = routeApi.useSearch();
  const t = useT();
  const [status, setStatus] = useState<Status>("loading");
  const verifyEmailMutation = useVerifyEmailMutation();
  const verify = verifyEmailMutation.mutate;

  useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }
    verify(
      { data: { token } },
      {
        onSuccess: () => setStatus("success"),
        onError: () => setStatus("error"),
      },
    );
  }, [token, verify]);

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
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "16px",
                  py: "40px",
                }}
              >
                <CircularProgress size={28} />
                <Box component="p" className="lp-form-sub">
                  {t("auth.verify_email.loading")}
                </Box>
              </Box>
            )}

            {status === "success" && (
              <Box className="aip-success">
                <Box className="aip-success-icon">
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 28 28"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M6 14l6 6 10-10"
                      style={{ stroke: "var(--auth-indigo-500)" }}
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Box>
                <Box component="p" className="aip-success-title">
                  {t("auth.verify_email.success_title")}
                </Box>
                <Box component="p" className="aip-success-sub">
                  {t("auth.verify_email.success_sub")}
                </Box>
                <button
                  type="button"
                  className="lp-submit"
                  style={{ marginTop: "24px" }}
                  onClick={() => navigate({ to: ROUTES.LOGIN })}
                >
                  {t("auth.verify_email.go_to_login")}
                </button>
              </Box>
            )}

            {status === "error" && (
              <Box className="aip-success">
                <Box
                  className="aip-success-icon"
                  sx={{
                    background:
                      "color-mix(in srgb, var(--auth-red-600) 10%, transparent) !important",
                  }}
                >
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 28 28"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M9 9l10 10M19 9L9 19"
                      style={{ stroke: "var(--auth-red-600)" }}
                      strokeWidth="2.4"
                      strokeLinecap="round"
                    />
                  </svg>
                </Box>
                <Box component="p" className="aip-success-title">
                  {t("auth.verify_email.error_title")}
                </Box>
                <Box component="p" className="aip-success-sub">
                  {t("auth.verify_email.error_sub")}
                </Box>
                <button
                  type="button"
                  className="lp-submit"
                  style={{ marginTop: "24px" }}
                  onClick={() => navigate({ to: ROUTES.LOGIN })}
                >
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
