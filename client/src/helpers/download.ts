import apiClient from "@/configs/apiClient";
import { API_BASE_URL } from "@/configs/env";

export const MIME_TYPES = {
  XLSX: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  JSON: "application/json",
  PDF: "application/pdf",
  ZIP: "application/zip",
} as const;

const BLOB_RESPONSE_TYPE = "blob";
const CONTENT_DISPOSITION_HEADER = "content-disposition";
const ENCODED_FILENAME_PATTERN = /filename\*=UTF-8''([^;]+)/i;
const PLAIN_FILENAME_PATTERN = /filename="?([^";]+)"?/i;

function decodeOrNull(value: string): string | null {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

function resolveFileName(header: unknown, fallback: string): string {
  if (typeof header !== "string") return fallback;

  const encoded = header.match(ENCODED_FILENAME_PATTERN)?.[1];
  if (encoded) return decodeOrNull(encoded) ?? fallback;

  return header.match(PLAIN_FILENAME_PATTERN)?.[1]?.trim() || fallback;
}

function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

type BlobErrorResponse = { response?: { data?: unknown } };

async function revealBlobError(err: unknown): Promise<never> {
  const response = (err as BlobErrorResponse)?.response;

  if (response?.data instanceof Blob) {
    try {
      response.data = JSON.parse(await response.data.text());
    } catch {
      response.data = undefined;
    }
  }

  throw err;
}

export async function downloadFile(
  endpoint: string,
  fallbackFilename: string,
  mimeType?: string,
  params?: Record<string, unknown>,
): Promise<void> {
  const response = await apiClient
    .get(endpoint, {
      params,
      responseType: BLOB_RESPONSE_TYPE,
    })
    .catch(revealBlobError);
  saveBlob(
    new Blob([response.data], mimeType ? { type: mimeType } : undefined),
    resolveFileName(
      response.headers?.[CONTENT_DISPOSITION_HEADER],
      fallbackFilename,
    ),
  );
}

export async function downloadExcel(
  endpoint: string,
  fallbackFilename: string,
  params?: Record<string, unknown>,
): Promise<void> {
  await downloadFile(endpoint, fallbackFilename, MIME_TYPES.XLSX, params);
}

const TICKET_ATTACHMENT_PATH_PATTERN =
  /^\/api\/tickets\/[0-9a-f-]{36}\/attachments\/[0-9a-f-]{36}$/i;

export async function downloadFromAbsoluteUrl(
  url: string,
  fallbackFilename: string,
): Promise<void> {
  const target = new URL(url, window.location.origin);
  const apiOrigin = new URL(
    API_BASE_URL || window.location.origin,
    window.location.origin,
  ).origin;
  if (
    target.origin !== apiOrigin ||
    !TICKET_ATTACHMENT_PATH_PATTERN.test(target.pathname)
  )
    throw new Error("Pièce jointe invalide");
  await downloadFile(target.pathname, fallbackFilename);
}
