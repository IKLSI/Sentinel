import type React from "react";
import Box from "@mui/material/Box";
import FolderOpenOutlined from "@mui/icons-material/FolderOpenOutlined";
import { useNavigate } from "@tanstack/react-router";
import { EmptyState } from "@/components/ui/common/EmptyState";
import { useI18n } from "@/contexts/I18nContext";
import type { ProjectHealth } from "@/domains/dashboard/types";
import { CardLink } from "@/features/dashboard/pages/DashboardPage/components/CardLink";
import { DashboardCard } from "@/features/dashboard/pages/DashboardPage/components/DashboardCard";
import { ProjectHealthRow } from "@/features/dashboard/pages/DashboardPage/components/ProjectHealthRow";

interface Props {
  projects: ProjectHealth[];
}

export const ProjectsSection: React.FC<Props> = ({ projects }) => {
  const { t } = useI18n();
  const navigate = useNavigate();

  return (
    <DashboardCard
      title={t("dashboard.projects.title")}
      action={
        <CardLink
          label={t("dashboard.projects.see_all")}
          onClick={() => navigate({ to: "/projects" })}
        />
      }
    >
      {projects.length === 0 ? (
        <EmptyState
          icon={FolderOpenOutlined}
          title={t("dashboard.projects.empty_title")}
          subtitle={t("dashboard.projects.empty_subtitle")}
        />
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {projects.map((project) => (
            <ProjectHealthRow key={project.id} project={project} />
          ))}
        </Box>
      )}
    </DashboardCard>
  );
};
