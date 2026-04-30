import React from "react";
import Box from "@mui/material/Box";
import KeyboardArrowDownOutlined from "@mui/icons-material/KeyboardArrowDownOutlined";
import { useT } from "@/i18n/I18nContext";
import { ProjectDto } from "@/features/techHealth/api/projects";
import { GRADE_VISUAL, GradeKey, HeadCell } from "../../helpers";
import { ProjectRow } from "../ProjectRow";

interface Props {
  grade: GradeKey;
  items: ProjectDto[];
  collapsed: boolean;
  onToggleCollapsed: () => void;
  scanningId: string | null;
  onEdit: (project: ProjectDto) => void;
  onDelete: (project: ProjectDto) => void;
  onScan: (id: string) => void;
}

export const ProjectsSection: React.FC<Props> = ({
  grade,
  items,
  collapsed,
  onToggleCollapsed,
  scanningId,
  onEdit,
  onDelete,
  onScan,
}) => {
  const t = useT();
  const cfg = GRADE_VISUAL[grade];
  const { Icon } = cfg;

  return (
    <Box
      sx={{
        background: "var(--s1)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r)",
        overflow: "hidden",
      }}
    >
      <Box
        component="button"
        type="button"
        aria-expanded={!collapsed}
        aria-label={
          collapsed
            ? t("projects.section.expand")
            : t("projects.section.collapse")
        }
        onClick={onToggleCollapsed}
        sx={{
          all: "unset",
          width: "100%",
          boxSizing: "border-box",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          p: "11px 14px",
          background: "var(--s2)",
          borderBottom: "1px solid var(--border)",
          transition: "background 0.12s",
          "&:hover": { background: "var(--s3)" },
          "&:focus-visible": {
            outline: "2px solid var(--accent)",
            outlineOffset: "-2px",
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            minWidth: 0,
          }}
        >
          <Box
            sx={{
              width: "34px",
              height: "34px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: cfg.iconColor,
              flexShrink: 0,
            }}
          >
            <Icon sx={{ fontSize: 22 }} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Box
              sx={{
                fontSize: "13px",
                fontWeight: 700,
                color: cfg.iconColor,
                lineHeight: 1.2,
                letterSpacing: "-0.01em",
                fontFamily: "var(--font-ui)",
              }}
            >
              {t(`projects.grade.${grade}.label`)}
            </Box>
            <Box
              sx={{
                fontSize: "11px",
                color: "var(--muted2)",
                mt: "2px",
                lineHeight: 1.2,
              }}
            >
              {t(`projects.grade.${grade}.subtitle`)}
            </Box>
          </Box>
        </Box>
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--muted2)",
          }}
        >
          <KeyboardArrowDownOutlined
            sx={{
              fontSize: 20,
              transform: collapsed ? "rotate(0deg)" : "rotate(180deg)",
              transition: "transform 360ms cubic-bezier(0.22, 1, 0.36, 1)",
              transformOrigin: "center",
              willChange: "transform",
            }}
          />
        </Box>
      </Box>

      {!collapsed && (
        <Box sx={{ overflowX: "auto" }}>
          <Box
            component="table"
            sx={{
              width: "100%",
              minWidth: "1060px",
              borderCollapse: "collapse",
              tableLayout: "fixed",
            }}
          >
            <Box component="colgroup">
              {(["56%", "12%", "10%", "12%", "10%"] as const).map((w, i) => (
                <Box key={i} component="col" sx={{ width: w }} />
              ))}
            </Box>
            <Box component="thead">
              <Box component="tr">
                <HeadCell>{t("projects.table.project")}</HeadCell>
                <HeadCell align="center">
                  {t("projects.table.vulnerabilities")}
                </HeadCell>
                <HeadCell align="center">
                  {t("projects.table.critical")}
                </HeadCell>
                <HeadCell align="center">
                  {t("projects.table.tickets")}
                </HeadCell>
                <HeadCell />
              </Box>
            </Box>
            <Box component="tbody">
              {items.map((project) => (
                <ProjectRow
                  key={project.id}
                  project={project}
                  onEdit={() => onEdit(project)}
                  onDelete={() => onDelete(project)}
                  onScan={() => onScan(project.id)}
                  isScanning={scanningId === project.id}
                />
              ))}
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};
