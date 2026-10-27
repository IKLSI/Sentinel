import type React from "react";
import Box from "@mui/material/Box";
import ErrorOutlineOutlined from "@mui/icons-material/ErrorOutlineOutlined";
import Button from "@mui/material/Button";
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
        tone="danger"
        title={t("common.load_error_title")}
        subtitle={t("common.load_error_subtitle")}
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
