import React from "react";
import Box from "@mui/material/Box";
import { useNavigate } from "react-router-dom";
import RefreshOutlined from "@mui/icons-material/RefreshOutlined";
import DeleteOutlineOutlined from "@mui/icons-material/DeleteOutlineOutlined";
import { RowActions } from "@/components/RowActions";
import { useT } from "@/i18n/I18nContext";
import { ProjectDto } from "@/features/techHealth/api/projects";

interface Props {
  project: ProjectDto;
  onDelete: () => void;
  onScan: () => void;
  isScanning: boolean;
}

export const ProjectRow: React.FC<Props> = ({
  project,
  onDelete,
  onScan,
  isScanning,
}) => {
  const navigate = useNavigate();
  const t = useT();
  const ticketCount = 0;

  return (
    <Box
      component="tr"
      onClick={() => navigate(`/projects/${project.id}`)}
      sx={{
        cursor: "pointer",
        position: "relative",
        transition: "background 0.12s ease",
        "& td": {
          transition: "background 0.12s ease, border-color 0.12s ease",
          verticalAlign: "middle",
        },
        "&:hover td": { background: "var(--s2)" },
        "&:hover .row-actions": { opacity: "1 !important" },
      }}
    >
      <Box
        component="td"
        sx={{
          padding: "8px 12px",
          borderBottom: "1px solid var(--border)",
          fontSize: "12px",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            minWidth: 0,
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Box
              sx={{
                fontFamily: "inherit",
                fontWeight: 700,
                color: "var(--text)",
                fontSize: "13px",
                lineHeight: 1.25,
                letterSpacing: "-0.02em",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {project.name}
            </Box>
            <Box
              sx={{
                mt: "3px",
                color: "var(--muted2)",
                fontSize: "11px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                whiteSpace: "nowrap",
              }}
            >
              {project.totalDependencies}{" "}
              {project.totalDependencies > 1
                ? t("projects.dependencies_plural")
                : t("projects.dependency_singular")}
            </Box>
          </Box>
        </Box>
      </Box>

      <Box
        component="td"
        sx={{
          padding: "8px 12px",
          borderBottom: "1px solid var(--border)",
          textAlign: "center",
        }}
      >
        <Box
          sx={{
            color:
              project.totalVulnerabilities > 0
                ? "var(--orange)"
                : "var(--muted2)",
            fontWeight: project.totalVulnerabilities > 0 ? 700 : 500,
            fontSize: "13px",
            lineHeight: 1.25,
            fontFamily: "var(--font-mono)",
          }}
        >
          {project.totalVulnerabilities}
        </Box>
      </Box>

      <Box
        component="td"
        sx={{
          padding: "8px 12px",
          borderBottom: "1px solid var(--border)",
          textAlign: "center",
        }}
      >
        <Box
          sx={{
            color:
              project.criticalVulnerabilities > 0
                ? "var(--red)"
                : "var(--muted2)",
            fontWeight: project.criticalVulnerabilities > 0 ? 700 : 500,
            fontSize: "13px",
            lineHeight: 1.25,
            fontFamily: "var(--font-mono)",
          }}
        >
          {project.criticalVulnerabilities}
        </Box>
      </Box>

      <Box
        component="td"
        sx={{
          padding: "8px 12px",
          borderBottom: "1px solid var(--border)",
          textAlign: "center",
        }}
      >
        <Box
          sx={{
            color: ticketCount > 0 ? "var(--text)" : "var(--muted2)",
            fontWeight: ticketCount > 0 ? 700 : 500,
            fontSize: "13px",
            fontFamily: "var(--font-mono)",
            lineHeight: 1.25,
          }}
        >
          {ticketCount}
        </Box>
      </Box>

      <Box
        component="td"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
        sx={{
          padding: "8px 40px 8px 0",
          borderBottom: "1px solid var(--border)",
          whiteSpace: "nowrap",
          overflow: "visible",
          textAlign: "right",
        }}
      >
        <RowActions
          actions={[
            {
              icon: (
                <RefreshOutlined
                  sx={{
                    fontSize: 12,
                    animation: isScanning ? "spin 1s linear infinite" : "none",
                  }}
                />
              ),
              label: t("projects.action.scan"),
              onClick: (e) => {
                e.stopPropagation();
                onScan();
              },
              color: "yellow",
              disabled: isScanning,
            },
            {
              icon: <DeleteOutlineOutlined sx={{ fontSize: 12 }} />,
              label: t("projects.action.delete"),
              onClick: (e) => {
                e.stopPropagation();
                onDelete();
              },
              color: "red",
            },
          ]}
        />
      </Box>
    </Box>
  );
};
