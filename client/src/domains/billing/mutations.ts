import { ROUTES_API } from "@/configs/api-routes.gen";
import { usePostMutation } from "@/domains/helpers";
import type {
  CheckoutRequest,
  CheckoutSession,
  PortalSession,
} from "@/domains/billing/types";

export const useStartCheckoutMutation = () =>
  usePostMutation<CheckoutSession, CheckoutSession, { data: CheckoutRequest }>(
    ROUTES_API.api.billing.checkout.__path,
  );

export const useOpenPortalMutation = () =>
  usePostMutation<PortalSession, PortalSession>(
    ROUTES_API.api.billing.portal.__path,
  );
