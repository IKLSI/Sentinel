import type React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ErrorOutlineOutlined from "@mui/icons-material/ErrorOutlineOutlined";
import { EmptyState } from "@/components/ui/common/feedback/EmptyState";
import { useT } from "@/contexts/I18nContext";

interface Props {
  onRetry: () => void;
  retrying: boolean;
}

export const LoadErrorState: React.FC<Props> = ({ onRetry, retrying }) => {
  const t = useT();

  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <EmptyState
        icon={ErrorOutlineOutlined}
        title={t("common.load_error_title")}
        subtitle={t("common.load_error_subtitle")}
        iconSize={40}
        action={
          <Button
            variant="contained"
            size="small"
            onClick={onRetry}
            disabled={retrying}
          >
            {t("common.retry")}
          </Button>
        }
      />
    </Box>
  );
};
