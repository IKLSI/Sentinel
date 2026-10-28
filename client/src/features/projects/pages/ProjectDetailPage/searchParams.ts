export const ProjectTab = {
  Vulnerabilities: "vulnerabilities",
  Dependencies: "dependencies",
  Runtimes: "runtimes",
  Deployments: "deployments",
} as const;
export type ProjectTab = (typeof ProjectTab)[keyof typeof ProjectTab];

export type ProjectDetailSearch = {
  tab?: ProjectTab;
  base?: string;
  head?: string;
};

const MAX_REFERENCE_LENGTH = 255;

const readReference = (value: unknown) =>
  typeof value === "string" &&
  value.trim().length > 0 &&
  value.length <= MAX_REFERENCE_LENGTH
    ? value
    : undefined;

export const sanitizeProjectDetailSearch = (
  search: Record<string, unknown>,
): ProjectDetailSearch => ({
  tab: Object.values(ProjectTab).find((tab) => tab === search.tab),
  base: readReference(search.base),
  head: readReference(search.head),
});
