import { useCallback, useState } from "react";
import { useT } from "@/contexts/I18nContext";
import { useImportProjectsMutation } from "@/domains/projects/mutations";
import type { AvailableRepo } from "@/domains/projects/types";
import type { ScanFrequency } from "@/enums";
import { useApiErrorToast } from "@/hooks/useApiErrorToast";
import { useToast } from "@/hooks/useToast";

export const useRepoSelection = (visibleUrls: string[]) => {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = useCallback(
    (url: string) =>
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(url)) next.delete(url);
        else next.add(url);
        return next;
      }),
    [],
  );

  const selectAll = () => {
    const allSel = visibleUrls.every((u) => selected.has(u));
    setSelected((prev) =>
      allSel
        ? new Set([...prev].filter((u) => !visibleUrls.includes(u)))
        : new Set([...prev, ...visibleUrls]),
    );
  };

  const clear = useCallback(() => setSelected(new Set()), []);

  return { selected, toggle, selectAll, clear };
};

export const useImportRepos = (onImported: () => void) => {
  const t = useT();
  const { showToast } = useToast();
  const onImportError = useApiErrorToast("projects.toast.import_error");
  const importProjectsMutation = useImportProjectsMutation();

  const importRepos = async (
    toImport: AvailableRepo[],
    scanFrequency: ScanFrequency,
  ) => {
    try {
      await importProjectsMutation.mutateAsync({
        data: {
          projects: toImport.map((r) => ({
            name: r.name,
            repositoryUrl: r.url,
            repositoryType: r.platform,
            scanFrequency,
          })),
        },
      });
      showToast(
        t("projects.toast.import_success", { count: toImport.length }),
        "success",
      );
      onImported();
    } catch (err) {
      onImportError(err);
    }
  };

  return { importRepos, importing: importProjectsMutation.isPending };
};
