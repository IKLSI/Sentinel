import { useMutation } from "@tanstack/react-query";
import { ROUTES_API } from "@/configs/api-routes.gen";
import { toIsoDate } from "@/formatters/fileName";
import { downloadExcel, downloadFromAbsoluteUrl } from "@/helpers/download";
import { TICKETS_EXPORT_FILE_PREFIX } from "@/domains/tickets/constants";
import type { TicketExportFilters } from "@/domains/tickets/types";

const EXCEL_EXTENSION = ".xlsx";

export const useExportTicketsExcelMutation = () =>
  useMutation({
    mutationFn: (filters: TicketExportFilters = {}) =>
      downloadExcel(
        ROUTES_API.api.tickets.export.excel.__path,
        `${TICKETS_EXPORT_FILE_PREFIX}-${toIsoDate()}${EXCEL_EXTENSION}`,
        filters,
      ),
  });

export const useDownloadAttachmentMutation = () =>
  useMutation({
    mutationFn: ({ url, fileName }: { url: string; fileName: string }) =>
      downloadFromAbsoluteUrl(url, fileName),
  });
