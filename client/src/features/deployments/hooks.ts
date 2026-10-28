import { useCallback, useEffect } from "react";
import { getRouteApi } from "@tanstack/react-router";
import { useT } from "@/contexts/I18nContext";
import {
  useDeploymentComparisonQuery,
  useDeploymentRefsQuery,
} from "@/domains/deployments/queries";
import { useToast } from "@/hooks/useToast";
import {
  DEMO_COMPARISON,
  DEMO_REFS,
} from "@/features/deployments/demoFixtures";

const routeApi = getRouteApi("/_authenticated/projects/$id");

export const useDeploymentSelection = (projectId: string) => {
  const search = routeApi.useSearch();
  const navigate = routeApi.useNavigate();
  const realRefsQuery = useDeploymentRefsQuery(projectId);
  const realComparisonQuery = useDeploymentComparisonQuery(
    projectId,
    search.base,
    search.head,
  );
  const refs = DEMO_REFS;
  const refsQuery = {
    ...realRefsQuery,
    data: DEMO_REFS,
    isLoading: false,
    isError: false,
  } as typeof realRefsQuery;
  const comparisonQuery = {
    ...realComparisonQuery,
    data: search.base && search.head ? DEMO_COMPARISON : undefined,
    isLoading: false,
    isError: false,
  } as typeof realComparisonQuery;

  useEffect(() => {
    if (search.base || search.head || !refs?.available) return;
    const { suggestedBase, suggestedHead } = refs;
    if (!suggestedBase || !suggestedHead || suggestedBase === suggestedHead)
      return;
    navigate({
      search: (previous) => ({
        ...previous,
        base: suggestedBase,
        head: suggestedHead,
      }),
      replace: true,
    });
  }, [refs, search.base, search.head, navigate]);

  const compare = useCallback(
    (base: string, head: string) =>
      navigate({
        search: (previous) => ({ ...previous, base, head }),
        replace: true,
      }),
    [navigate],
  );

  return {
    base: search.base,
    head: search.head,
    refsQuery,
    comparisonQuery,
    compare,
  };
};

export const useCopyText = () => {
  const t = useT();
  const { showToast } = useToast();

  return useCallback(
    async (text: string, html?: string) => {
      try {
        if (html && typeof ClipboardItem !== "undefined")
          await navigator.clipboard.write([
            new ClipboardItem({
              "text/html": new Blob([html], { type: "text/html" }),
              "text/plain": new Blob([text], { type: "text/plain" }),
            }),
          ]);
        else await navigator.clipboard.writeText(text);
        return true;
      } catch {
        showToast(t("deployments.copy_error"), "error");
        return false;
      }
    },
    [showToast, t],
  );
};
