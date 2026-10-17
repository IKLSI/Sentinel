export const ORGANIZATION_QUERY_KEY = ["settings", "organization"] as const;

export const INTEGRATIONS_QUERY_KEY = ["settings", "integrations"] as const;

export const DEFAULT_GITLAB_BASE_URL = "https://gitlab.com";

export const EMPTY_INTEGRATION_SETTINGS = {
  gitlabBaseUrl: DEFAULT_GITLAB_BASE_URL,
  hasGithubToken: false,
  hasGitlabToken: false,
} as const;
