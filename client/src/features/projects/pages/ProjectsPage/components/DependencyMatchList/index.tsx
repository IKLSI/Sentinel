import type React from "react";
import Box from "@mui/material/Box";
import { useT } from "@/contexts/I18nContext";
import type { ProjectSearchMatch } from "@/domains/projects/types";
import { DependencyStatus } from "@/enums";

interface Props {
  match: ProjectSearchMatch;
}

export const DependencyMatchList: React.FC<Props> = ({ match }) => {
  const t = useT();
  const hiddenCount = match.dependencyMatchCount - match.dependencies.length;

  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        gap: "8px",
        minWidth: 0,
        overflow: "hidden",
        fontFamily: "var(--font-mono)",
      }}
    >
      {match.dependencies.map((dependency) => (
        <Box
          key={`${dependency.name}@${dependency.version}`}
          component="span"
          sx={{
            whiteSpace: "nowrap",
            color:
              dependency.status === DependencyStatus.Vulnerable
                ? "var(--red)"
                : "var(--text-secondary)",
          }}
        >
          {dependency.name}@{dependency.version}
        </Box>
      ))}
      {hiddenCount > 0 &&
        t("projects.search.more_matches", { count: hiddenCount })}
    </Box>
  );
};
