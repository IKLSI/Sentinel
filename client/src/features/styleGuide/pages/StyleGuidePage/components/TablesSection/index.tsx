import type React from "react";
import { useT } from "@/contexts/I18nContext";
import { Specimen } from "@/features/styleGuide/pages/StyleGuidePage/components/Specimen";
import { ProjectsTable } from "@/features/styleGuide/pages/StyleGuidePage/components/TablesSection/components/ProjectsTable";

export const TablesSection: React.FC = () => {
  const t = useT();

  return (
    <Specimen
      title={t("style_guide.tables.data")}
      note={t("style_guide.tables.data_note")}
      source="configs/themes/components/tables.ts"
    >
      <ProjectsTable />
    </Specimen>
  );
};
