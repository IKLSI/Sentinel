import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useT } from "../i18n/I18nContext";
import apiClient from "../services/client";
import { ROUTES } from "@/constants/routes";

interface ErrorPageProps {
  status?: number;
  message?: string;
  onRetry?: () => void;
}

export const ErrorPage: React.FC<ErrorPageProps> = ({
  status = 500,
  message,
  onRetry,
}) => {
  const navigate = useNavigate();
  const t = useT();
  const [supportEmail, setSupportEmail] = useState("");

  useEffect(() => {
    apiClient
      .get<{ supportEmail: string }>("/api/config")
      .then((res) => setSupportEmail(res.data.supportEmail ?? ""))
      .catch(() => {});
  }, []);

  const is404 = status === 404;
  const defaultMessage = t(is404 ? "error.404.title" : "error.500.title");
  const subtitle = t(is404 ? "error.404.subtitle" : "error.500.subtitle");

  return (
    <div className="ep-root">
      <div className="ep-glow" />
      <div className="ep-grid" />
      <div className="ep-ghost">{status}</div>

      <div className="ep-content">
        <div className="ep-title">{message ?? defaultMessage}</div>
        <div className="ep-subtitle">{subtitle}</div>

        <div className="ep-line">
          <span className="ep-line-label">sentinel</span>
        </div>

        <div className="ep-actions">
          {onRetry && (
            <button className="ep-btn-ghost" onClick={onRetry}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path
                  d="M1.5 6.5a5 5 0 1 0 1.2-3.2M1.5 2v2.5H4"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {t("error.retry")}
            </button>
          )}
          <button className="ep-btn-primary" onClick={() => navigate(ROUTES.HOME)}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path
                d="M2 6.5L8 2l6 4.5V14a1 1 0 0 1-1 1h-3.5v-3.5h-3V15H3a1 1 0 0 1-1-1V6.5Z"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {t("error.back_home")}
          </button>
        </div>

        {supportEmail && (
          <div className="ep-support">
            {t("error.contact_support")} —{" "}
            <a href={`mailto:${supportEmail}`}>{supportEmail}</a>
          </div>
        )}
      </div>
    </div>
  );
};
