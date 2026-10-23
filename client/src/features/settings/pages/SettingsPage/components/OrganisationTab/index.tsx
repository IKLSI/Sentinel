import type React from "react";
import { useEffect, useMemo } from "react";
import { type FieldErrors, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import KeyboardArrowDownOutlined from "@mui/icons-material/KeyboardArrowDownOutlined";
import { useToast } from "@/hooks/useToast";
import { useT } from "@/contexts/I18nContext";
import { EMPTY_INTEGRATION_SETTINGS } from "@/domains/settings/constants";
import type { VulnerabilitySeverity } from "@/enums";
import {
  useConnectGithubMutation,
  useConnectGitlabMutation,
  useUpdateOrganizationSettingsMutation,
} from "@/domains/settings/mutations";
import {
  useIntegrationSettingsQuery,
  useOrganizationSettingsQuery,
} from "@/domains/settings/queries";
import {
  CARD_SX,
  CardHeader,
  FieldLabel,
  SEVERITY_VALUES,
  inp,
} from "@/features/settings/pages/SettingsPage/helpers";
import { IntegrationRow } from "@/features/settings/pages/SettingsPage/components/IntegrationRow";
import { GitlabInstanceFields } from "@/features/settings/pages/SettingsPage/components/GitlabInstanceFields";
import { useApiErrorToast } from "@/hooks/useApiErrorToast";
import {
  type GithubIntegrationFormValues,
  type GitlabIntegrationFormValues,
  type OrganizationFormValues,
  githubIntegrationSchema,
  gitlabIntegrationSchema,
  organizationSchema,
} from "@/features/settings/pages/SettingsPage/components/OrganisationTab/schemas";

const DEFAULT_ORGANIZATION_FORM: OrganizationFormValues = {
  name: "",
  securityAlertsEnabled: true,
  alertMinSeverity: "High",
};

const ALERTS_DISABLED_VALUE = "None";

export const OrganisationTab: React.FC = () => {
  const { showToast } = useToast();
  const t = useT();
  const onOrgUpdateError = useApiErrorToast("settings.toast.org_update_error");
  const onGithubError = useApiErrorToast("settings.toast.github_error");
  const onGitlabError = useApiErrorToast("settings.toast.gitlab_error");

  const SEVERITIES = useMemo(
    () =>
      [ALERTS_DISABLED_VALUE, ...SEVERITY_VALUES].map((value) => ({
        value,
        label: t(`settings.severity.${value}`),
      })),
    [t],
  );

  const organizationQuery = useOrganizationSettingsQuery();
  const org = organizationQuery.data ?? null;
  const loadingOrg = organizationQuery.isLoading;
  const updateOrg = useUpdateOrganizationSettingsMutation();
  const savingOrg = updateOrg.isPending;

  const integrationsQuery = useIntegrationSettingsQuery();
  const integrations = integrationsQuery.data ?? EMPTY_INTEGRATION_SETTINGS;
  const connectGithubMutation = useConnectGithubMutation();
  const connectGitlabMutation = useConnectGitlabMutation();
  const connectingGithub = connectGithubMutation.isPending;
  const connectingGitlab = connectGitlabMutation.isPending;

  const orgForm = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationSchema),
    defaultValues: DEFAULT_ORGANIZATION_FORM,
  });
  const githubForm = useForm<GithubIntegrationFormValues>({
    resolver: zodResolver(githubIntegrationSchema),
    defaultValues: { token: "" },
  });
  const gitlabForm = useForm<GitlabIntegrationFormValues>({
    resolver: zodResolver(gitlabIntegrationSchema),
    defaultValues: { token: "", baseUrl: "" },
  });

  const resetOrgForm = orgForm.reset;
  const resetGitlabForm = gitlabForm.reset;

  useEffect(() => {
    if (!integrationsQuery.data) return;
    resetGitlabForm(
      { token: "", baseUrl: integrationsQuery.data.gitlabBaseUrl },
      { keepDirtyValues: true },
    );
  }, [integrationsQuery.data, resetGitlabForm]);

  useEffect(() => {
    if (!org) return;
    resetOrgForm(
      {
        name: org.name,
        securityAlertsEnabled: org.securityAlertsEnabled,
        alertMinSeverity: org.alertMinSeverity,
      },
      { keepDirtyValues: true },
    );
  }, [org, resetOrgForm]);

  const warnFirstError = (errors: FieldErrors) => {
    const message = Object.values(errors)[0]?.message;
    if (typeof message === "string") showToast(t(message), "warning");
  };

  const handleSaveOrg = orgForm.handleSubmit((values) => {
    updateOrg.mutate(
      {
        data: {
          name: values.name,
          securityAlertsEnabled: values.securityAlertsEnabled,
          alertMinSeverity: values.alertMinSeverity as VulnerabilitySeverity,
        },
      },
      {
        onSuccess: () => showToast(t("settings.toast.org_updated"), "success"),
        onError: onOrgUpdateError,
      },
    );
  }, warnFirstError);

  const handleConnectGithub = githubForm.handleSubmit(({ token }) => {
    connectGithubMutation.mutate(
      { data: { token } },
      {
        onSuccess: () => {
          githubForm.setValue("token", "");
          showToast(t("settings.toast.github_connected"), "success");
        },
        onError: onGithubError,
      },
    );
  }, warnFirstError);

  const handleConnectGitlab = gitlabForm.handleSubmit(({ token, baseUrl }) => {
    connectGitlabMutation.mutate(
      { data: { token, baseUrl: baseUrl || null } },
      {
        onSuccess: () => {
          gitlabForm.setValue("token", "");
          showToast(t("settings.toast.gitlab_connected"), "success");
        },
        onError: onGitlabError,
      },
    );
  }, warnFirstError);

  const securityAlertsEnabled = orgForm.watch("securityAlertsEnabled");
  const alertMinSeverity = orgForm.watch("alertMinSeverity");

  const handleSeverityChange = (value: string) => {
    const enabled = value !== ALERTS_DISABLED_VALUE;
    orgForm.setValue("securityAlertsEnabled", enabled, { shouldDirty: true });
    if (enabled)
      orgForm.setValue("alertMinSeverity", value, { shouldDirty: true });
  };

  return (
    <Box sx={{ overflow: "auto", flex: 1, pr: "4px" }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          pb: "8px",
        }}
      >
        <Box sx={CARD_SX}>
          <CardHeader label={t("settings.org.identity")} />
          {loadingOrg ? (
            <Box sx={{ p: "24px", display: "flex", justifyContent: "center" }}>
              <CircularProgress size={20} />
            </Box>
          ) : (
            <>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "8px",
                  px: "16px",
                  py: "12px",
                }}
              >
                <Box>
                  <FieldLabel>{t("settings.org.name_label")}</FieldLabel>
                  <Box
                    component="input"
                    type="text"
                    sx={inp}
                    {...orgForm.register("name")}
                  />
                </Box>
                <Box>
                  <FieldLabel>
                    {t("settings.org.alert_min_severity_label")}
                  </FieldLabel>
                  <Box sx={{ position: "relative" }}>
                    <Box
                      component="select"
                      sx={{
                        ...inp,
                        pr: "28px",
                        cursor: "pointer",
                        appearance: "none",
                      }}
                      value={
                        securityAlertsEnabled
                          ? alertMinSeverity
                          : ALERTS_DISABLED_VALUE
                      }
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                        handleSeverityChange(e.target.value)
                      }
                    >
                      {SEVERITIES.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </Box>
                    <KeyboardArrowDownOutlined
                      sx={{
                        fontSize: 14,
                        color: "var(--muted)",
                        position: "absolute",
                        right: "8px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        pointerEvents: "none",
                      }}
                    />
                  </Box>
                </Box>
              </Box>

              <Box
                sx={{
                  px: "16px",
                  py: "10px",
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleSaveOrg}
                  disabled={savingOrg || !orgForm.formState.isDirty}
                  sx={{ minWidth: "110px" }}
                >
                  {savingOrg
                    ? t("settings.org.saving")
                    : t("settings.org.save")}
                </Button>
              </Box>
            </>
          )}
        </Box>

        <Box sx={CARD_SX}>
          <CardHeader label={t("settings.integrations.title")} />
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: "1px",
              background: "var(--border)",
            }}
          >
            <IntegrationRow
              iconBackground="var(--brand-github)"
              icon={
                <Box
                  component="svg"
                  viewBox="0 0 16 16"
                  sx={{ width: 20, height: 20, fill: "#fff" }}
                >
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                </Box>
              }
              name="GitHub"
              isConnected={integrations.hasGithubToken}
              connectedLabel={t("settings.integrations.github_token_set")}
              helpInstructions={t(
                "settings.integrations.github_help_instructions",
              )}
              helpScopes={["repo", "read:org"]}
              placeholder={t("settings.integrations.github_placeholder")}
              token={githubForm.watch("token")}
              onTokenChange={(value) => githubForm.setValue("token", value)}
              onConnect={handleConnectGithub}
              connecting={connectingGithub}
            />

            <IntegrationRow
              iconBackground="#fff"
              iconBorder="1px solid var(--border)"
              icon={
                <Box
                  component="svg"
                  viewBox="90 90 200 195"
                  sx={{ width: 20, height: 20 }}
                >
                  <path
                    style={{ fill: "var(--brand-gitlab-2)" }}
                    d="M282.83,170.73l-.27-.69-26.14-68.22a6.81,6.81,0,0,0-2.69-3.24,7,7,0,0,0-8,.43,7,7,0,0,0-2.32,3.52l-17.65,54H154.29l-17.65-54A6.86,6.86,0,0,0,134.32,99a7,7,0,0,0-8-.43,6.87,6.87,0,0,0-2.69,3.24L97.44,170l-.26.69a48.54,48.54,0,0,0,16.1,56.1l.09.07.24.17,39.82,29.82,19.7,14.91,12,9.06a8.07,8.07,0,0,0,9.76,0l12-9.06,19.7-14.91,40.06-30,.1-.08A48.56,48.56,0,0,0,282.83,170.73Z"
                  />
                  <path
                    style={{ fill: "var(--brand-gitlab)" }}
                    d="M282.83,170.73l-.27-.69a88.3,88.3,0,0,0-35.15,15.8L190,229.25c19.55,14.79,36.57,27.64,36.57,27.64l40.06-30,.1-.08A48.56,48.56,0,0,0,282.83,170.73Z"
                  />
                  <path
                    style={{ fill: "var(--brand-gitlab-3)" }}
                    d="M153.43,256.89l19.7,14.91,12,9.06a8.07,8.07,0,0,0,9.76,0l12-9.06,19.7-14.91S209.55,244,190,229.25C170.45,244,153.43,256.89,153.43,256.89Z"
                  />
                  <path
                    style={{ fill: "var(--brand-gitlab)" }}
                    d="M132.58,185.84A88.19,88.19,0,0,0,97.44,170l-.26.69a48.54,48.54,0,0,0,16.1,56.1l.09.07.24.17,39.82,29.82s17-12.85,36.57-27.64Z"
                  />
                </Box>
              }
              name="GitLab"
              isConnected={integrations.hasGitlabToken}
              connectedLabel={t("settings.integrations.gitlab_token_set")}
              helpInstructions={t(
                "settings.integrations.gitlab_help_instructions",
              )}
              helpScopes={["read_api", "read_repository"]}
              placeholder={t("settings.integrations.gitlab_placeholder")}
              tokenLabel={t("settings.integrations.gitlab_token_label")}
              token={gitlabForm.watch("token")}
              onTokenChange={(value) =>
                gitlabForm.setValue("token", value, { shouldDirty: true })
              }
              onConnect={handleConnectGitlab}
              connecting={connectingGitlab}
            >
              <GitlabInstanceFields
                baseUrl={gitlabForm.watch("baseUrl")}
                onBaseUrlChange={(value) =>
                  gitlabForm.setValue("baseUrl", value, { shouldDirty: true })
                }
              />
            </IntegrationRow>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
