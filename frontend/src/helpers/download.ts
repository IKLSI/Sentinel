import apiClient from "@/configs/apiClient";
import { API_BASE_URL } from "@/configs/env";

export const MIME_TYPES = {
  XLSX: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  JSON: "application/json",
  PDF: "application/pdf",
} as const;

const BLOB_RESPONSE_TYPE = "blob";

function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function downloadFile(
  endpoint: string,
  filename: string,
  mimeType?: string,
  params?: Record<string, unknown>,
): Promise<void> {
  const response = await apiClient.get(endpoint, {
    params,
    responseType: BLOB_RESPONSE_TYPE,
  });
  saveBlob(
    new Blob([response.data], mimeType ? { type: mimeType } : undefined),
    filename,
  );
}

export async function downloadExcel(
  endpoint: string,
  filename: string,
  params?: Record<string, unknown>,
): Promise<void> {
  await downloadFile(endpoint, filename, MIME_TYPES.XLSX, params);
}

export async function downloadFromAbsoluteUrl(
  url: string,
  filename: string,
): Promise<void> {
  const path = url.startsWith(API_BASE_URL)
    ? url.slice(API_BASE_URL.length)
    : url;
  await downloadFile(path, filename);
}
