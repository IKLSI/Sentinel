import type React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CloudOffOutlined from "@mui/icons-material/CloudOffOutlined";
import ErrorOutlineOutlined from "@mui/icons-material/ErrorOutlineOutlined";
import RocketLaunchOutlined from "@mui/icons-material/RocketLaunchOutlined";
import { EmptyState } from "@/components/ui/common/feedback/EmptyState";
import { useT } from "@/contexts/I18nContext";
import { DeploymentSkeleton } from "@/features/deployments/components/DeploymentSkeleton";
import { DeploymentToolbar } from "@/features/deployments/components/DeploymentToolbar";
import { ReleaseReview } from "@/features/deployments/components/ReleaseReview";
import { useDeploymentSelection } from "@/features/deployments/hooks";
import { useApiError } from "@/hooks/useApiError";

interface Props {
  projectId: string;
}

const CENTERED_SX = {
  flex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
} as const;

export const DeploymentsTab: React.FC<Props> = ({ projectId }) => {
  const t = useT();
  const apiError = useApiError();
  const { base, head, refsQuery, comparisonQuery, compare } =
    useDeploymentSelection(projectId);
  const comparison = comparisonQuery.data;

  const renderContent = () => {
    if (refsQuery.data && !refsQuery.data.available)
      return (
        <Box sx={CENTERED_SX}>
          <EmptyState
            icon={CloudOffOutlined}
            tone="danger"
            title={t("deployments.empty.unavailable_title")}
            subtitle={t("deployments.empty.unavailable_subtitle")}
          />
        </Box>
      );

    if (comparisonQuery.isError)
      return (
        <Box sx={CENTERED_SX}>
          <EmptyState
            icon={ErrorOutlineOutlined}
            tone="danger"
            title={t("deployments.empty.error_title")}
            subtitle={apiError(
              comparisonQuery.error,
              t("deployments.empty.error_subtitle"),
            )}
            action={
              <Button
                variant="contained"
                size="small"
                onClick={() => void comparisonQuery.refetch()}
                disabled={comparisonQuery.isFetching}
              >
                {t("common.retry")}
              </Button>
            }
          />
        </Box>
      );

    if (refsQuery.isLoading || comparisonQuery.isLoading)
      return <DeploymentSkeleton />;

    if (!comparison)
      return (
        <Box sx={CENTERED_SX}>
          <EmptyState
            icon={RocketLaunchOutlined}
            title={t("deployments.empty.pick_title")}
            subtitle={t("deployments.empty.pick_subtitle")}
          />
        </Box>
      );

    return <ReleaseReview comparison={comparison} />;
  };

  return (
    <Box
      sx={{
        flex: "1 1 auto",
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <DeploymentToolbar
        refs={refsQuery.data}
        base={base}
        head={head}
        onCompare={compare}
      />
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          overflowY: { xs: "auto", lg: "visible" },
        }}
      >
        {renderContent()}
      </Box>
    </Box>
  );
};
