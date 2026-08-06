import type React from "react";
import { useEffect } from "react";
import Box from "@mui/material/Box";
import CheckOutlined from "@mui/icons-material/CheckOutlined";
import StarOutlined from "@mui/icons-material/StarOutlined";
import { CenteredLoader } from "@/components/ui/common/CenteredLoader";
import { useT } from "@/contexts/I18nContext";
import { useToast } from "@/hooks/useToast";
import { useApiErrorToast } from "@/hooks/useApiErrorToast";
import {
  useOpenPortalMutation,
  useStartCheckoutMutation,
} from "@/domains/billing/mutations";
import {
  useBillingPlansQuery,
  useBillingStatusQuery,
} from "@/domains/billing/queries";
import {
  CARD_SX,
  CardHeader,
} from "@/features/settings/pages/SettingsPage/helpers";

const UNLIMITED = -1;
const WARN_THRESHOLD = 0.8;

const formatLimit = (limit: number, t: ReturnType<typeof useT>) =>
  limit === UNLIMITED ? t("settings.billing.unlimited") : String(limit);

const PLAN_ORDER = ["Free", "Pro", "Business"];

const BILLING_QUERY_PARAM = "billing";
const BILLING_RESULT = {
  SUCCESS: "success",
  CANCEL: "cancel",
} as const;

export const BillingTab: React.FC = () => {
  const t = useT();
  const onCheckoutError = useApiErrorToast("settings.billing.error_generic");
  const onPortalError = useApiErrorToast("settings.billing.error_generic");
  const { showToast } = useToast();
  const billingStatusQuery = useBillingStatusQuery();
  const billingPlansQuery = useBillingPlansQuery();
  const startCheckoutMutation = useStartCheckoutMutation();
  const openPortalMutation = useOpenPortalMutation();
  const status = billingStatusQuery.data ?? null;
  const rawPlans = billingPlansQuery.data ?? [];
  const loading = billingStatusQuery.isLoading || billingPlansQuery.isLoading;
  const actionLoading = startCheckoutMutation.isPending;

  const plans = [...rawPlans].sort(
    (a, b) => PLAN_ORDER.indexOf(a.tier) - PLAN_ORDER.indexOf(b.tier),
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const billing = params.get(BILLING_QUERY_PARAM);
    if (billing === BILLING_RESULT.SUCCESS)
      showToast(t("settings.billing.checkout_success"), "success");
    else if (billing === BILLING_RESULT.CANCEL)
      showToast(t("settings.billing.checkout_cancel"), "info");
    if (billing) window.history.replaceState({}, "", window.location.pathname);
  }, [showToast, t]);

  const handleCheckout = (tier: string) => {
    startCheckoutMutation.mutate(
      { data: { planTier: tier } },
      {
        onSuccess: (session) => {
          if (session.url) window.location.href = session.url;
        },
        onError: onCheckoutError,
      },
    );
  };

  const handleOpenPortal = () => {
    openPortalMutation.mutate(
      {},
      {
        onSuccess: (session) => {
          if (session.url) window.location.href = session.url;
        },
        onError: onPortalError,
      },
    );
  };

  if (loading || !status) {
    return <CenteredLoader />;
  }

  const quotas = [
    { label: t("settings.billing.quota_projects"), data: status.projects },
    { label: t("settings.billing.quota_members"), data: status.members },
    { label: t("settings.billing.quota_scans"), data: status.scans },
  ];

  return (
    <Box
      sx={{
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        width: "100%",
      }}
    >
      <Box sx={CARD_SX}>
        <CardHeader label={t("settings.billing.usage")} />
        <Box
          sx={{
            p: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {quotas.map((q) => {
            const isUnlimited =
              q.data.limit === UNLIMITED || q.data.limit === 0;
            const pct = isUnlimited
              ? 0
              : Math.min(100, Math.round((q.data.used / q.data.limit) * 100));
            const over = !isUnlimited && q.data.used >= q.data.limit;
            const warn =
              !isUnlimited &&
              !over &&
              q.data.used / q.data.limit >= WARN_THRESHOLD;
            const barColor = over
              ? "var(--red)"
              : warn
                ? "var(--orange)"
                : "var(--accent)";
            return (
              <Box key={q.label}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: "6px",
                  }}
                >
                  <Box
                    sx={{ display: "flex", alignItems: "center", gap: "6px" }}
                  >
                    <Box
                      sx={{
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "var(--text-secondary)",
                      }}
                    >
                      {q.label}
                    </Box>
                    {(over || warn) && (
                      <Box
                        sx={{
                          fontSize: "10px",
                          fontWeight: 700,
                          color: barColor,
                          letterSpacing: "0.04em",
                        }}
                      >
                        {over
                          ? `${pct}%`
                          : t("settings.billing.quota_near_limit")}
                      </Box>
                    )}
                  </Box>
                  <Box
                    sx={{
                      fontSize: "12px",
                      color: over ? "var(--red)" : "var(--muted)",
                      fontWeight: 600,
                    }}
                  >
                    {q.data.used} / {formatLimit(q.data.limit, t)}
                  </Box>
                </Box>
                <Box
                  sx={{
                    height: "5px",
                    borderRadius: "3px",
                    background: "var(--s3)",
                    overflow: "hidden",
                  }}
                >
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
          <Box
            sx={{
              px: "16px",
              minHeight: "48px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              flexWrap: "wrap",
              borderBottom: "1px solid var(--border)",
              background: "var(--s2)",
            }}
          >
            <Box
              sx={{
                fontSize: "10px",
                fontWeight: 700,
                color: "var(--muted)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              {t("settings.billing.available_plans")}
            </Box>
          </Box>
          <Box
            sx={{
              p: "16px",
              pt: "20px",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
              gap: "14px",
              alignItems: "stretch",
            }}
          >
            {plans.map((plan) => {
              const isRecommended =
                plan.tier === "Pro" && status.planTier === "Free";
              const highlight = plan.isCurrent || isRecommended;
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
                    p: "20px 18px 18px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                    background: plan.isCurrent
                      ? "linear-gradient(180deg, var(--accent-subtle), var(--s1) 70%)"
                      : isRecommended
                        ? "linear-gradient(180deg, color-mix(in srgb, var(--accent) 6%, var(--s1)), var(--s1) 60%)"
                        : "var(--s1)",
                    boxShadow: highlight
                      ? "0 8px 28px color-mix(in srgb, var(--accent) 14%, transparent)"
                      : "var(--sh-1)",
                    position: "relative",
                  }}
                >
                  {highlight && (
                    <Box
                      sx={{
                        position: "absolute",
                        top: "-11px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        px: "10px",
                        height: "22px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        borderRadius: "11px",
                        fontSize: "10px",
                        fontWeight: 800,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        whiteSpace: "nowrap",
                        color: "var(--s1)",
                        background: "var(--accent)",
                        boxShadow:
                          "0 4px 12px color-mix(in srgb, var(--accent) 40%, transparent)",
                      }}
                    >
                      {!plan.isCurrent && (
                        <StarOutlined sx={{ fontSize: 11 }} />
                      )}
                      {plan.isCurrent
                        ? t("settings.billing.current_badge")
                        : t("settings.billing.plan_recommended")}
                    </Box>
                  )}

                  <Box>
                    <Box
                      sx={{
                        fontSize: "11px",
                        fontWeight: 700,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: "var(--muted)",
                        mb: "8px",
                      }}
                    >
                      {plan.tier}
                    </Box>
                    {plan.priceMonthly === 0 ? (
                      <Box
                        sx={{
                          fontSize: "26px",
                          fontWeight: 800,
                          letterSpacing: "-0.02em",
                          color: plan.isCurrent
                            ? "var(--accent)"
                            : "var(--text)",
                        }}
                      >
                        {t("settings.billing.plan_free")}
                      </Box>
                    ) : (
                      <Box
                        sx={{
                          fontSize: "26px",
                          fontWeight: 800,
                          letterSpacing: "-0.02em",
                          color: plan.isCurrent
                            ? "var(--accent)"
                            : "var(--text)",
                        }}
                      >
                        {t("settings.billing.plan_price_monthly", {
                          price: plan.priceMonthly,
                        })}
                      </Box>
                    )}
                  </Box>

                  <Box
                    sx={{
                      height: "1px",
                      background: "var(--border)",
                      opacity: 0.7,
                    }}
                  />

                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                    }}
                  >
                    {[
                      {
                        label: t("settings.billing.quota_projects"),
                        value: formatLimit(plan.maxProjects, t),
                      },
                      {
                        label: t("settings.billing.quota_members"),
                        value: formatLimit(plan.maxMembers, t),
                      },
                      {
                        label: t("settings.billing.quota_scans"),
                        value: formatLimit(plan.maxScansPerMonth, t),
                      },
                    ].map((item) => (
                      <Box
                        key={item.label}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: "9px",
                        }}
                      >
                        <Box
                          sx={{
                            width: "18px",
                            height: "18px",
                            borderRadius: "50%",
                            flexShrink: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "var(--accent-subtle)",
                          }}
                        >
                          <CheckOutlined
                            sx={{ fontSize: 12, color: "var(--accent)" }}
                          />
                        </Box>
                        <Box
                          sx={{
                            fontSize: "12.5px",
                            color: "var(--text-secondary)",
                          }}
                        >
                          <Box
                            component="span"
                            sx={{ fontWeight: 700, color: "var(--text)" }}
                          >
                            {item.value}
                          </Box>{" "}
                          {item.label.toLowerCase()}
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
                        boxSizing: "border-box",
                        width: "100%",
                        mt: "auto",
                        height: "38px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "var(--r-sm)",
                        fontSize: "12.5px",
                        fontWeight: 700,
                        color: "var(--s1)",
                        background:
                          "linear-gradient(180deg, color-mix(in srgb, var(--accent) 92%, white), var(--accent))",
                        boxShadow:
                          "0 4px 14px color-mix(in srgb, var(--accent) 30%, transparent)",
                        transition:
                          "transform 0.15s, box-shadow 0.15s, opacity 0.15s",
                        "&:hover": {
                          boxShadow:
                            "0 6px 20px color-mix(in srgb, var(--accent) 42%, transparent)",
                        },
                        "&:active": { transform: "scale(0.98)" },
                        "&:disabled": {
                          opacity: 0.5,
                          cursor: "not-allowed",
                          boxShadow: "none",
                        },
                      }}
                    >
                      {t("settings.billing.upgrade_to")} {plan.tier}
                    </Box>
                  )}

                  {plan.isCurrent && plan.tier !== "Free" && (
                    <Box
                      component="button"
                      onClick={handleOpenPortal}
                      disabled={openPortalMutation.isPending}
                      sx={{
                        all: "unset",
                        cursor: "pointer",
                        boxSizing: "border-box",
                        width: "100%",
                        mt: "auto",
                        height: "38px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "var(--r-sm)",
                        fontSize: "12.5px",
                        fontWeight: 700,
                        color: "var(--s1)",
                        background:
                          "linear-gradient(180deg, color-mix(in srgb, var(--accent) 92%, white), var(--accent))",
                        boxShadow:
                          "0 4px 14px color-mix(in srgb, var(--accent) 30%, transparent)",
                        transition:
                          "transform 0.15s, box-shadow 0.15s, opacity 0.15s",
                        "&:hover": {
                          boxShadow:
                            "0 6px 20px color-mix(in srgb, var(--accent) 42%, transparent)",
                        },
                        "&:active": { transform: "scale(0.98)" },
                        "&:disabled": {
                          opacity: 0.5,
                          cursor: "not-allowed",
                          boxShadow: "none",
                        },
                      }}
                    >
                      {t("settings.billing.manage_subscription")}
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
