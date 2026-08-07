import { useMutation } from "@tanstack/react-query";
import { ROUTES_API } from "@/configs/api-routes.gen";
import { downloadExcel, downloadFromAbsoluteUrl } from "@/helpers/download";
import { TICKETS_EXPORT_FALLBACK_FILE } from "@/domains/tickets/constants";
import type { TicketExportFilters } from "@/domains/tickets/types";

export const useExportTicketsExcelMutation = () =>
  useMutation({
    mutationFn: (filters: TicketExportFilters = {}) =>
      downloadExcel(
        ROUTES_API.api.tickets.export.excel.__path,
        TICKETS_EXPORT_FALLBACK_FILE,
        filters,
      ),
  });

export const useDownloadAttachmentMutation = () =>
  useMutation({
    mutationFn: ({ url, fileName }: { url: string; fileName: string }) =>
      downloadFromAbsoluteUrl(url, fileName),
  });
