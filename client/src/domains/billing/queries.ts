import { ROUTES_API } from "@/configs/api-routes.gen";
import { useGetQuery } from "@/domains/helpers";
import {
  BILLING_PLANS_QUERY_KEY,
  BILLING_STATUS_QUERY_KEY,
} from "@/domains/billing/constants";
import type { BillingStatus, PlanOption } from "@/domains/billing/types";

export const useBillingStatusQuery = () =>
  useGetQuery<BillingStatus>(
    ROUTES_API.api.billing.status.__path,
    {},
    { queryKey: BILLING_STATUS_QUERY_KEY },
  );

export const useBillingPlansQuery = () =>
  useGetQuery<PlanOption[]>(
    ROUTES_API.api.billing.plans.__path,
    {},
    { queryKey: BILLING_PLANS_QUERY_KEY },
  );
