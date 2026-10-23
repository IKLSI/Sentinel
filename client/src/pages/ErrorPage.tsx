import type React from "react";
import { useNavigate } from "@tanstack/react-router";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Link from "@mui/material/Link";
import { useT } from "@/contexts/I18nContext";
import { useAppConfigQuery } from "@/domains/settings/queries";
import { ROUTES } from "@/constants/routes";
import {
  ERROR_CONTENT_SX,
  ERROR_DIVIDER_SX,
  ERROR_DOT_GRID_SX,
  ERROR_GHOST_SX,
  ERROR_GLOW_SX,
  ERROR_ROOT_SX,
  ERROR_SUBTITLE_SX,
  ERROR_SUPPORT_LINK_SX,
  ERROR_SUPPORT_SX,
  ERROR_TITLE_SX,
} from "@/pages/errorPageStyles";

interface ErrorPageProps {
  status?: number;
  onRetry?: () => void;
}

export const ErrorPage: React.FC<ErrorPageProps> = ({
  status = 500,
  onRetry,
}) => {
  const navigate = useNavigate();
  const t = useT();
  const supportEmail = useAppConfigQuery().data?.supportEmail ?? "";

  const is404 = status === 404;
  const title = t(is404 ? "error.404.title" : "error.500.title");
  const subtitle = t(is404 ? "error.404.subtitle" : "error.500.subtitle");

  return (
    <Box sx={ERROR_ROOT_SX}>
      <Box sx={ERROR_GLOW_SX} />
      <Box sx={ERROR_DOT_GRID_SX} />
      <Box sx={ERROR_GHOST_SX}>{status}</Box>

      <Box sx={ERROR_CONTENT_SX}>
        <Box sx={ERROR_TITLE_SX}>{title}</Box>
        <Box sx={ERROR_SUBTITLE_SX}>{subtitle}</Box>

        <Divider sx={ERROR_DIVIDER_SX}>sentinel</Divider>

        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
          }}
        >
          {onRetry && (
            <Button
              variant="outlined"
              onClick={onRetry}
              startIcon={
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 13 13"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M1.5 6.5a5 5 0 1 0 1.2-3.2M1.5 2v2.5H4"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              }
            >
              {t("error.retry")}
            </Button>
          )}
          <Button
            variant="contained"
            onClick={() => navigate({ to: ROUTES.HOME })}
            startIcon={
              <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M2 6.5L8 2l6 4.5V14a1 1 0 0 1-1 1h-3.5v-3.5h-3V15H3a1 1 0 0 1-1-1V6.5Z"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            }
          >
            {t("error.back_home")}
          </Button>
        </Box>

        {supportEmail && (
          <Box sx={ERROR_SUPPORT_SX}>
            {t("error.contact_support")} —{" "}
            <Link href={`mailto:${supportEmail}`} sx={ERROR_SUPPORT_LINK_SX}>
              {supportEmail}
            </Link>
          </Box>
        )}
      </Box>
    </Box>
  );
};
