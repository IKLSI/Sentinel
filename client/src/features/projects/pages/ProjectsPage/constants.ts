import type { CellAlign } from "@/components/ui/common/VirtualTable/TableCells";

interface ProjectColumn {
  id: string;
  width: string;
  labelKey: string | null;
  align: CellAlign;
}

export const PROJECT_COLUMNS: readonly ProjectColumn[] = [
  {
    id: "name",
    width: "auto",
    labelKey: "projects.table.project",
    align: "left",
  },
  {
    id: "score",
    width: "110px",
    labelKey: "projects.table.score",
    align: "center",
  },
  {
    id: "vulnerabilities",
    width: "110px",
    labelKey: "projects.table.vulnerabilities",
    align: "center",
  },
  {
    id: "critical",
    width: "110px",
    labelKey: "projects.table.critical",
    align: "center",
  },
  {
    id: "tickets",
    width: "100px",
    labelKey: "projects.table.tickets",
    align: "center",
  },
  { id: "actions", width: "110px", labelKey: null, align: "left" },
];
