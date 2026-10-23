import { ROUTES_API } from "@/configs/api-routes.gen";
import { usePostMutation } from "@/domains/helpers";
import type {
  PublicScanRequest,
  PublicScanResponse,
} from "@/domains/publicScan/types";

export const usePublicScanMutation = () =>
  usePostMutation<
    PublicScanResponse,
    PublicScanResponse,
    { data: PublicScanRequest }
  >(ROUTES_API.api.public.scan.__path);
