import type { Translate } from "@/contexts/I18nContext";

export const importButtonLabel = (
  t: Translate,
  importing: boolean,
  selectedCount: number,
) => {
  if (importing) return t("projects.import_modal.importing");
  if (selectedCount > 0)
    return t("projects.import_modal.import_count", { count: selectedCount });
  return t("projects.import_modal.import");
};

export const emptyRepoListTitle = (
  t: Translate,
  hasToken: boolean,
  fetchFailed: boolean,
) => {
  if (!hasToken) return t("projects.import_modal.no_token");
  if (fetchFailed) return t("projects.import_modal.fetch_failed_title");
  return t("projects.import_modal.empty");
};

export const emptyRepoListSubtitle = (
  t: Translate,
  hasToken: boolean,
  fetchFailed: boolean,
  fetchFailedStatusCode: number | null,
) => {
  if (!hasToken || !fetchFailed) return undefined;
  if (fetchFailedStatusCode == null)
    return t("projects.import_modal.fetch_failed_subtitle_generic");
  return t("projects.import_modal.fetch_failed_subtitle", {
    status: fetchFailedStatusCode,
  });
};
