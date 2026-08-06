import { ROUTES_API } from "@/configs/api-routes.gen";
import { usePostMutation } from "@/domains/helpers";
import type { CheckoutRequest, CheckoutSession } from "@/domains/billing/types";

export const useStartCheckoutMutation = () =>
  usePostMutation<CheckoutSession, CheckoutSession, { data: CheckoutRequest }>(
    ROUTES_API.api.billing.checkout.__path,
  );
