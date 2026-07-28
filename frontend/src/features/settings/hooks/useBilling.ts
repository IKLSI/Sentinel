import { useMutation, useQuery } from "@tanstack/react-query";
import { getBillingStatus, getPlans, startCheckout } from "../api/billing";

const BILLING_STATUS_QUERY_KEY = ["billing", "status"] as const;
const BILLING_PLANS_QUERY_KEY = ["billing", "plans"] as const;

export const useBillingStatus = () => {
  const query = useQuery({
    queryKey: BILLING_STATUS_QUERY_KEY,
    queryFn: ({ signal }) => getBillingStatus(signal),
  });

  return {
    status: query.data ?? null,
    loading: query.isLoading,
  };
};

export const useBillingPlans = () => {
  const query = useQuery({
    queryKey: BILLING_PLANS_QUERY_KEY,
    queryFn: ({ signal }) => getPlans(signal),
  });

  return {
    plans: query.data ?? [],
    loading: query.isLoading,
  };
};

export const useStartCheckout = () => {
  return useMutation({
    mutationFn: ({
      tier,
      interval,
    }: {
      tier: string;
      interval: "monthly" | "annual";
    }) => startCheckout(tier, interval),
  });
};
