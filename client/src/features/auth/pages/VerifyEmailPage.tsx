import type React from "react";
import { useEffect, useState } from "react";
import { getRouteApi } from "@tanstack/react-router";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import { useVerifyEmailMutation } from "@/domains/auth/mutations";
import { SentinelWordmark } from "@/components/layout/SentinelWordmark";
import { useT } from "@/contexts/I18nContext";
import { ROUTES } from "@/constants/routes";
import { AuthLayout } from "@/features/auth/components/AuthLayout";
import { AuthPageSuccess } from "@/features/auth/components/AuthSuccessPanel";
import { AuthSubmitButton } from "@/features/auth/components/AuthSubmitButton";

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

  const goToLogin = (
    <AuthSubmitButton spaced onClick={() => navigate({ to: ROUTES.LOGIN })}>
      {t("auth.verify_email.go_to_login")}
    </AuthSubmitButton>
  );

  return (
    <AuthLayout>
      <Box sx={{ mb: "32px", color: "var(--text)" }}>
        <SentinelWordmark height={14} />
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
          <Box
            component="p"
            sx={{ m: 0, fontSize: "13px", color: "var(--auth-gray-500)" }}
          >
            {t("auth.verify_email.loading")}
          </Box>
        </Box>
      )}

      {status === "success" && (
        <AuthPageSuccess
          title={t("auth.verify_email.success_title")}
          subtitle={t("auth.verify_email.success_sub")}
        >
          {goToLogin}
        </AuthPageSuccess>
      )}

      {status === "error" && (
        <AuthPageSuccess
          failed
          title={t("auth.verify_email.error_title")}
          subtitle={t("auth.verify_email.error_sub")}
        >
          {goToLogin}
        </AuthPageSuccess>
      )}
    </AuthLayout>
  );
};
