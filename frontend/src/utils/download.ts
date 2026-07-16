import apiClient from "../services/client";

export const MIME_TYPES = {
  XLSX: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  JSON: "application/json",
  PDF: "application/pdf",
} as const;

export async function downloadFile(
  endpoint: string,
  filename: string,
  mimeType: string,
  params?: Record<string, unknown>,
): Promise<void> {
  const response = await apiClient.get(endpoint, {
    params,
    responseType: "blob",
  });
  const url = URL.createObjectURL(
    new Blob([response.data], { type: mimeType }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function downloadExcel(
  endpoint: string,
  filename: string,
  params?: Record<string, unknown>,
): Promise<void> {
  await downloadFile(endpoint, filename, MIME_TYPES.XLSX, params);
}
