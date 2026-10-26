export const JOBS_GRID_SX = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
  gap: "16px",
} as const;

export const JOB_CARD_SX = {
  display: "flex",
  flexDirection: "column",
  gap: "16px",
  p: "20px",
  background: "var(--s1)",
  border: "1px solid var(--border)",
  borderRadius: "var(--r-lg)",
} as const;

export const JOB_SCHEDULE_SX = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  background: "var(--s2)",
  border: "1px solid var(--border)",
  borderRadius: "var(--r-md)",
} as const;

export const JOB_SCHEDULE_SLOT_SX = {
  p: "12px 10px",
  "& + &": { borderLeft: "1px solid var(--border)" },
} as const;
