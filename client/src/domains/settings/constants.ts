export const ORGANIZATION_QUERY_KEY = ["settings", "organization"] as const;

export const INTEGRATIONS_QUERY_KEY = ["settings", "integrations"] as const;

export const EMPTY_INTEGRATION_SETTINGS = {
  hasGithubToken: false,
  hasGitlabToken: false,
} as const;
