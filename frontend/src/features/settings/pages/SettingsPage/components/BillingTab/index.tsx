import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import { useT } from "@/i18n/I18nContext";
import { useToast } from "@/hooks/useToast";
import { extractApiError } from "@/utils/apiError";
import {
  BillingStatus,
  PlanOption,
  getBillingStatus,
  getPlans,
  startCheckout,
  openBillingPortal,
} from "@/features/settings/api/billing";
import { CARD_SX, CardHeader } from "../../helpers";

const UNLIMITED = -1;

const formatLimit = (limit: number, t: ReturnType<typeof useT>) =>
  limit === UNLIMITED ? t("settings.billing.unlimited") : String(limit);

export const BillingTab: React.FC = () => {
  const t = useT();
  const { showToast } = useToast();
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const load = () => {
    const controller = new AbortController();
    setLoading(true);
    Promise.all([getBillingStatus(controller.signal), getPlans(controller.signal)])
      .then(([s, p]) => {
        setStatus(s);
        setPlans(p);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => controller.abort();
  };

  useEffect(load, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const billing = params.get("billing");
    if (billing === "success") showToast(t("settings.billing.checkout_success"), "success");
    else if (billing === "cancel") showToast(t("settings.billing.checkout_cancel"), "info");
    if (billing) window.history.replaceState({}, "", window.location.pathname);
  }, [showToast, t]);

  const handleCheckout = async (tier: string) => {
    setActionLoading(true);
    try {
      const url = await startCheckout(tier);
      window.location.href = url;
    } catch (err) {
      showToast(extractApiError(err, t("settings.billing.error_generic")), "error");
      setActionLoading(false);
    }
  };

  const handlePortal = async () => {
    setActionLoading(true);
    try {
      const url = await openBillingPortal();
      window.location.href = url;
    } catch (err) {
      showToast(extractApiError(err, t("settings.billing.error_generic")), "error");
      setActionLoading(false);
    }
  };

  if (loading || !status) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: "60px" }}>
        <CircularProgress size={26} />
      </Box>
    );
  }

  const quotas = [
    { label: t("settings.billing.quota_projects"), data: status.projects },
    { label: t("settings.billing.quota_members"), data: status.members },
    { label: t("settings.billing.quota_scans"), data: status.scans },
  ];

  return (
    <Box sx={{ overflowY: "auto", display: "flex", flexDirection: "column", gap: "20px", width: "100%" }}>
      <Box sx={CARD_SX}>
        <CardHeader label={t("settings.billing.current_plan")} />
        <Box sx={{ p: "16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <Box>
            <Box sx={{ fontSize: "20px", fontWeight: 700, color: "var(--text)" }}>{status.planTier}</Box>
            <Box sx={{ fontSize: "12px", color: "var(--muted)", mt: "2px" }}>
              {t("settings.billing.status_label")}: {status.subscriptionStatus}
              {status.currentPeriodEnd
                ? ` · ${t("settings.billing.renews_on")} ${new Date(status.currentPeriodEnd).toLocaleDateString()}`
                : ""}
            </Box>
          </Box>
          {status.hasActiveSubscription && (
            <Box
              component="button"
              onClick={handlePortal}
              disabled={actionLoading}
              sx={{
                all: "unset",
                cursor: "pointer",
                px: "16px",
                height: "34px",
                display: "flex",
                alignItems: "center",
                borderRadius: "var(--r-sm)",
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--text)",
                background: "var(--s2)",
                border: "1px solid var(--border)",
                "&:hover": { background: "var(--s3)" },
              }}
            >
              {t("settings.billing.manage_subscription")}
            </Box>
          )}
        </Box>
      </Box>

      <Box sx={CARD_SX}>
        <CardHeader label={t("settings.billing.usage")} />
        <Box sx={{ p: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
          {quotas.map((q) => {
            const pct =
              q.data.limit === UNLIMITED || q.data.limit === 0
                ? 0
                : Math.min(100, Math.round((q.data.used / q.data.limit) * 100));
            const over = q.data.limit !== UNLIMITED && q.data.used >= q.data.limit;
            return (
              <Box key={q.label}>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: "6px" }}>
                  <Box sx={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)" }}>{q.label}</Box>
                  <Box sx={{ fontSize: "12px", color: over ? "var(--red)" : "var(--muted)", fontWeight: 600 }}>
                    {q.data.used} / {formatLimit(q.data.limit, t)}
                  </Box>
                </Box>
                <Box sx={{ height: "6px", borderRadius: "3px", background: "var(--s3)", overflow: "hidden" }}>
                  <Box
                    sx={{
                      height: "100%",
                      width: `${pct}%`,
                      borderRadius: "3px",
                      background: over ? "var(--red)" : "var(--accent)",
                      transition: "width 0.3s",
                    }}
                  />
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>

      <Box sx={CARD_SX}>
        <CardHeader label={t("settings.billing.available_plans")} />
        <Box sx={{ p: "16px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
          {plans.map((plan) => (
            <Box
              key={plan.tier}
              sx={{
                border: plan.isCurrent ? "1px solid var(--accent)" : "1px solid var(--border)",
                borderRadius: "var(--r-md)",
                p: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                background: plan.isCurrent ? "var(--accent-subtle)" : "var(--s1)",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Box sx={{ fontSize: "15px", fontWeight: 700, color: "var(--text)" }}>{plan.tier}</Box>
                {plan.isCurrent && (
                  <Box sx={{ fontSize: "10px", fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    {t("settings.billing.current_badge")}
                  </Box>
                )}
              </Box>
              <Box sx={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.8 }}>
                <div>{t("settings.billing.quota_projects")}: {formatLimit(plan.maxProjects, t)}</div>
                <div>{t("settings.billing.quota_members")}: {formatLimit(plan.maxMembers, t)}</div>
                <div>{t("settings.billing.quota_scans")}: {formatLimit(plan.maxScansPerMonth, t)}</div>
              </Box>
              {!plan.isCurrent && plan.tier !== "Free" && (
                <Box
                  component="button"
                  onClick={() => handleCheckout(plan.tier)}
                  disabled={actionLoading}
                  sx={{
                    all: "unset",
                    cursor: "pointer",
                    textAlign: "center",
                    mt: "auto",
                    height: "32px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "var(--r-sm)",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "var(--s1)",
                    background: "var(--accent)",
                    "&:hover": { opacity: 0.9 },
                  }}
                >
                  {t("settings.billing.upgrade_to")} {plan.tier}
                </Box>
              )}
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
};
