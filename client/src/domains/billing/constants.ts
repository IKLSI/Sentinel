export const BILLING_STATUS_QUERY_KEY = ["billing", "status"] as const;

export const BILLING_PLANS_QUERY_KEY = ["billing", "plans"] as const;

export const BILLING_INTERVAL = {
  Monthly: "monthly",
  Annual: "annual",
} as const;

export type BillingInterval =
  (typeof BILLING_INTERVAL)[keyof typeof BILLING_INTERVAL];
