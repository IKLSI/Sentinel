export const SCAN_FEEDBACK_TIMEOUT_MS = 10 * 60 * 1000;

export const PROJECT_COLUMN_WIDTHS = [
  { id: "name", width: "auto" },
  { id: "score", width: "110px" },
  { id: "vulnerabilities", width: "110px" },
  { id: "critical", width: "110px" },
  { id: "tickets", width: "100px" },
  { id: "actions", width: "110px" },
] as const;
