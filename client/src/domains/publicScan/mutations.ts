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
  >("/api/public/scan");
