import { useMutation } from "@tanstack/react-query";
import { ROUTES_API } from "@/configs/api-routes.gen";
import { MIME_TYPES, downloadExcel, downloadFile } from "@/helpers/download";
import { buildUrl } from "@/helpers/url";
import {
  COMPLIANCE_REPORT_FALLBACK_FILE,
  PROJECTS_EXPORT_FALLBACK_FILE,
  SBOM_FALLBACK_FILE,
  type SbomFormat,
} from "@/domains/projects/constants";

export const useExportProjectsExcelMutation = () =>
  useMutation({
    mutationFn: () =>
      downloadExcel(
        ROUTES_API.api.techHealth.projects.export.excel.__path,
        PROJECTS_EXPORT_FALLBACK_FILE,
      ),
  });

export const useDownloadSbomMutation = () =>
  useMutation({
    mutationFn: ({
      projectId,
      format,
    }: {
      projectId: string;
      format: SbomFormat;
    }) =>
      downloadFile(
        buildUrl(ROUTES_API.api.techHealth.projects[":id"].sbom.__path, {
          id: projectId,
        }),
        SBOM_FALLBACK_FILE,
        MIME_TYPES.JSON,
        { format },
      ),
  });

export const useDownloadComplianceReportMutation = () =>
  useMutation({
    mutationFn: ({ projectId }: { projectId: string }) =>
      downloadFile(
        buildUrl(
          ROUTES_API.api.techHealth.projects[":id"].complianceReport.__path,
          { id: projectId },
        ),
        COMPLIANCE_REPORT_FALLBACK_FILE,
        MIME_TYPES.PDF,
      ),
  });
