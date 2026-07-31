import { useMutation } from "@tanstack/react-query";
import { ROUTES_API } from "@/configs/api-routes.gen";
import { slugify, toIsoDate } from "@/formatters/fileName";
import { MIME_TYPES, downloadExcel, downloadFile } from "@/helpers/download";
import { buildUrl } from "@/helpers/url";
import {
  COMPLIANCE_REPORT_FILE_PREFIX,
  PROJECTS_EXPORT_FILE_PREFIX,
  SBOM_FILE_PREFIX,
  type SbomFormat,
} from "@/domains/projects/constants";

const EXCEL_EXTENSION = ".xlsx";
const JSON_EXTENSION = ".json";
const PDF_EXTENSION = ".pdf";

type ProjectDownloadVariables = {
  projectId: string;
  projectName: string;
};

export const useExportProjectsExcelMutation = () =>
  useMutation({
    mutationFn: () =>
      downloadExcel(
        ROUTES_API.api.techHealth.projects.export.excel.__path,
        `${PROJECTS_EXPORT_FILE_PREFIX}-${toIsoDate()}${EXCEL_EXTENSION}`,
      ),
  });

export const useDownloadSbomMutation = () =>
  useMutation({
    mutationFn: ({
      projectId,
      projectName,
      format,
    }: ProjectDownloadVariables & { format: SbomFormat }) =>
      downloadFile(
        buildUrl(ROUTES_API.api.techHealth.projects[":id"].sbom.__path, {
          id: projectId,
        }),
        `${SBOM_FILE_PREFIX}-${slugify(projectName)}-${format}${JSON_EXTENSION}`,
        MIME_TYPES.JSON,
        { format },
      ),
  });

export const useDownloadComplianceReportMutation = () =>
  useMutation({
    mutationFn: ({ projectId, projectName }: ProjectDownloadVariables) =>
      downloadFile(
        buildUrl(
          ROUTES_API.api.techHealth.projects[":id"].complianceReport.__path,
          { id: projectId },
        ),
        `${COMPLIANCE_REPORT_FILE_PREFIX}-${slugify(projectName)}${PDF_EXTENSION}`,
        MIME_TYPES.PDF,
      ),
  });
