import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import CheckOutlined from "@mui/icons-material/CheckOutlined";
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
const WARN_THRESHOLD = 0.8;

const formatLimit = (limit: number, t: ReturnType<typeof useT>) =>
  limit === UNLIMITED ? t("settings.billing.unlimited") : String(limit);

const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  active:     { color: "var(--green)",  bg: "var(--green-subtle)" },
  trialing:   { color: "var(--accent)", bg: "var(--accent-subtle)" },
  past_due:   { color: "var(--orange)", bg: "var(--orange-subtle)" },
  canceled:   { color: "var(--red)",    bg: "var(--red-subtle)" },
  incomplete: { color: "var(--yellow)", bg: "var(--yellow-subtle)" },
  none:       { color: "var(--muted)",  bg: "var(--s3)" },
};

const STATUS_I18N: Record<string, string> = {
  active:     "settings.billing.status_active",
  trialing:   "settings.billing.status_trialing",
  past_due:   "settings.billing.status_past_due",
  canceled:   "settings.billing.status_canceled",
  incomplete: "settings.billing.status_incomplete",
  none:       "settings.billing.status_none",
};

const PLAN_ORDER = ["Free", "Pro", "Business"];

const BILLING_QUERY_PARAM = "billing";
const BILLING_RESULT = {
  SUCCESS: "success",
  CANCEL: "cancel",
} as const;

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
        setPlans(p.sort((a, b) => PLAN_ORDER.indexOf(a.tier) - PLAN_ORDER.indexOf(b.tier)));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => controller.abort();
  };

  useEffect(load, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const billing = params.get(BILLING_QUERY_PARAM);
    if (billing === BILLING_RESULT.SUCCESS) showToast(t("settings.billing.checkout_success"), "success");
    else if (billing === BILLING_RESULT.CANCEL) showToast(t("settings.billing.checkout_cancel"), "info");
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

  const statusKey = status.subscriptionStatus.toLowerCase();
  const statusStyle = STATUS_STYLE[statusKey] ?? STATUS_STYLE.none;
  const statusLabel = STATUS_I18N[statusKey]
    ? t(STATUS_I18N[statusKey])
    : status.subscriptionStatus;

  const quotas = [
    { label: t("settings.billing.quota_projects"), data: status.projects },
    { label: t("settings.billing.quota_members"), data: status.members },
    { label: t("settings.billing.quota_scans"), data: status.scans },
  ];

  return (
    <Box sx={{ overflowY: "auto", display: "flex", flexDirection: "column", gap: "20px", width: "100%" }}>
      <Box sx={CARD_SX}>
        <CardHeader label={t("settings.billing.current_plan")} />
        <Box sx={{ p: "16px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Box sx={{ fontSize: "22px", fontWeight: 800, color: "var(--text)", letterSpacing: "-0.02em" }}>
                {status.planTier}
              </Box>
              <Box
                sx={{
                  px: "8px",
                  height: "20px",
                  display: "inline-flex",
                  alignItems: "center",
                  borderRadius: "10px",
                  fontSize: "11px",
                  fontWeight: 700,
                  color: statusStyle.color,
                  background: statusStyle.bg,
                }}
              >
                {statusLabel}
              </Box>
            </Box>
            {status.currentPeriodEnd && (() => {
              const end = new Date(status.currentPeriodEnd);
              const daysLeft = Math.ceil((end.getTime() - Date.now()) / 86_400_000);
              const dateStr = end.toLocaleDateString();
              return (
                <Box sx={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  <Box sx={{ fontSize: "12px", color: "var(--muted)" }}>
                    {statusKey === "canceled"
                      ? t("settings.billing.period_ends_on")
                      : t("settings.billing.renews_on")}{" "}
                    {dateStr}
                  </Box>
                  {daysLeft > 0 && daysLeft <= 30 && (
                    <Box
                      sx={{
                        fontSize: "11px",
                        fontWeight: 700,
                        color: daysLeft <= 7 ? "var(--red)" : "var(--orange)",
                        background: daysLeft <= 7 ? "var(--red-subtle)" : "var(--orange-subtle)",
                        px: "6px",
                        height: "18px",
                        display: "inline-flex",
                        alignItems: "center",
                        borderRadius: "9px",
                      }}
                    >
                      {daysLeft === 1
                        ? t("settings.billing.days_remaining", { count: 1 })
                        : t("settings.billing.days_remaining_plural", { count: daysLeft })}
                    </Box>
                  )}
                </Box>
              );
            })()}
          </Box>
          {(status.hasActiveSubscription || statusKey === "canceled") && (
            <Box
              component="button"
              onClick={handlePortal}
              disabled={actionLoading}
              sx={{
                all: "unset",
                cursor: "pointer",
                px: "14px",
                height: "34px",
                display: "flex",
                alignItems: "center",
                borderRadius: "var(--r-sm)",
                fontSize: "13px",
                fontWeight: 600,
                color: statusKey === "canceled" ? "var(--s1)" : "var(--text)",
                background: statusKey === "canceled" ? "var(--accent)" : "var(--s2)",
                border: statusKey === "canceled" ? "none" : "1px solid var(--border)",
                "&:hover": { opacity: 0.88 },
              }}
            >
              {statusKey === "canceled"
                ? t("settings.billing.reactivate")
                : t("settings.billing.manage_subscription")}
            </Box>
          )}
        </Box>
        {(statusKey === "past_due" || statusKey === "trialing" || statusKey === "canceled") && (
          <Box
            sx={{
              mx: "16px",
              mb: "16px",
              px: "12px",
              py: "9px",
              borderRadius: "var(--r-sm)",
              fontSize: "12px",
              lineHeight: 1.5,
              background: statusKey === "past_due" ? "var(--red-subtle)" : statusKey === "trialing" ? "var(--accent-subtle)" : "var(--orange-subtle)",
              color: statusKey === "past_due" ? "var(--red)" : statusKey === "trialing" ? "var(--accent)" : "var(--orange)",
              border: `1px solid ${statusKey === "past_due" ? "color-mix(in srgb, var(--red) 25%, transparent)" : statusKey === "trialing" ? "var(--accent-border)" : "color-mix(in srgb, var(--orange) 25%, transparent)"}`,
            }}
          >
            {statusKey === "past_due" && t("settings.billing.alert_past_due")}
            {statusKey === "canceled" && status.currentPeriodEnd && t("settings.billing.alert_canceled", { date: new Date(status.currentPeriodEnd).toLocaleDateString() })}
            {statusKey === "trialing" && status.currentPeriodEnd && t("settings.billing.alert_trialing", { date: new Date(status.currentPeriodEnd).toLocaleDateString() })}
          </Box>
        )}
      </Box>

      <Box sx={CARD_SX}>
        <CardHeader label={t("settings.billing.usage")} />
        <Box sx={{ p: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
          {quotas.map((q) => {
            const isUnlimited = q.data.limit === UNLIMITED || q.data.limit === 0;
            const pct = isUnlimited ? 0 : Math.min(100, Math.round((q.data.used / q.data.limit) * 100));
            const over = !isUnlimited && q.data.used >= q.data.limit;
            const warn = !isUnlimited && !over && q.data.used / q.data.limit >= WARN_THRESHOLD;
            const barColor = over ? "var(--red)" : warn ? "var(--orange)" : "var(--accent)";
            return (
              <Box key={q.label}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: "6px" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <Box sx={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)" }}>{q.label}</Box>
                    {(over || warn) && (
                      <Box sx={{ fontSize: "10px", fontWeight: 700, color: barColor, letterSpacing: "0.04em" }}>
                        {over ? `${pct}%` : t("settings.billing.quota_near_limit")}
                      </Box>
                    )}
                  </Box>
                  <Box sx={{ fontSize: "12px", color: over ? "var(--red)" : "var(--muted)", fontWeight: 600 }}>
                    {q.data.used} / {formatLimit(q.data.limit, t)}
                  </Box>
                </Box>
                <Box sx={{ height: "5px", borderRadius: "3px", background: "var(--s3)", overflow: "hidden" }}>
                  <Box
                    sx={{
                      height: "100%",
                      width: isUnlimited ? "0%" : `${pct}%`,
                      borderRadius: "3px",
                      background: barColor,
                      transition: "width 0.3s",
                    }}
                  />
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>

      {plans.length > 0 && (
        <Box sx={CARD_SX}>
          <CardHeader label={t("settings.billing.available_plans")} />
          <Box sx={{ p: "16px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
            {plans.map((plan) => {
              const isRecommended = plan.tier === "Pro" && status.planTier === "Free";
              return (
                <Box
                  key={plan.tier}
                  sx={{
                    border: plan.isCurrent
                      ? "1.5px solid var(--accent)"
                      : isRecommended
                      ? "1.5px solid var(--accent-border)"
                      : "1px solid var(--border)",
                    borderRadius: "var(--r-md)",
                    p: "16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                    background: plan.isCurrent ? "var(--accent-subtle)" : "var(--s1)",
                    position: "relative",
                  }}
                >
                  {(plan.isCurrent || isRecommended) && (
                    <Box
                      sx={{
                        position: "absolute",
                        top: "-1px",
                        right: "12px",
                        px: "8px",
                        height: "18px",
                        display: "inline-flex",
                        alignItems: "center",
                        borderRadius: "0 0 6px 6px",
                        fontSize: "10px",
                        fontWeight: 700,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        color: "var(--s1)",
                        background: plan.isCurrent ? "var(--accent)" : "var(--accent-border)",
                      }}
                    >
                      {plan.isCurrent
                        ? t("settings.billing.current_badge")
                        : t("settings.billing.plan_recommended")}
                    </Box>
                  )}

                  <Box>
                    <Box sx={{ fontSize: "16px", fontWeight: 800, color: "var(--text)", mb: "4px" }}>{plan.tier}</Box>
                    <Box sx={{ fontSize: "20px", fontWeight: 700, color: plan.isCurrent ? "var(--accent)" : "var(--text)" }}>
                      {plan.priceMonthly === 0
                        ? t("settings.billing.plan_free")
                        : t("settings.billing.plan_price_monthly", { price: plan.priceMonthly })}
                    </Box>
                  </Box>

                  <Box sx={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {[
                      { label: t("settings.billing.quota_projects"), value: formatLimit(plan.maxProjects, t) },
                      { label: t("settings.billing.quota_members"), value: formatLimit(plan.maxMembers, t) },
                      { label: t("settings.billing.quota_scans"), value: formatLimit(plan.maxScansPerMonth, t) },
                    ].map((item) => (
                      <Box key={item.label} sx={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <CheckOutlined sx={{ fontSize: 13, color: "var(--accent)", flexShrink: 0 }} />
                        <Box sx={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                          <Box component="span" sx={{ fontWeight: 700, color: "var(--text)" }}>{item.value}</Box>
                          {" "}{item.label.toLowerCase()}
                        </Box>
                      </Box>
                    ))}
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
                        "&:hover": { opacity: 0.88 },
                        "&:disabled": { opacity: 0.5, cursor: "not-allowed" },
                      }}
                    >
                      {t("settings.billing.upgrade_to")} {plan.tier}
                    </Box>
                  )}
                </Box>
              );
            })}
          </Box>
        </Box>
      )}
    </Box>
  );
};
