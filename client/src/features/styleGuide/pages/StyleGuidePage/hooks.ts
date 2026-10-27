import { useCallback, useEffect, useState } from "react";
import { useT } from "@/contexts/I18nContext";
import { useTheme } from "@/contexts/ThemeContext";
import type { Theme } from "@/enums";
import { useToast } from "@/hooks/useToast";

interface ResolvedVars {
  theme: Theme | null;
  values: Record<string, string>;
}

const readCssVars = (names: readonly string[]) => {
  const styles = getComputedStyle(document.documentElement);
  return Object.fromEntries(
    names.map((name) => [name, styles.getPropertyValue(`--${name}`).trim()]),
  );
};

export const useResolvedCssVars = (names: readonly string[]) => {
  const { theme } = useTheme();
  const [resolved, setResolved] = useState<ResolvedVars>({
    theme: null,
    values: {},
  });

  useEffect(() => {
    setResolved({ theme, values: readCssVars(names) });
  }, [names, theme]);

  return resolved.values;
};

export const useCopyToken = () => {
  const t = useT();
  const { showToast } = useToast();

  return useCallback(
    async (token: string) => {
      await navigator.clipboard.writeText(`var(--${token})`);
      showToast(t("style_guide.copied", { token: `--${token}` }), "success");
    },
    [t, showToast],
  );
};
