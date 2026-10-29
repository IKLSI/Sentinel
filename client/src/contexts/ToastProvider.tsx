import type React from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Slide from "@mui/material/Slide";
import type { TransitionProps } from "@mui/material/transitions";
import Snackbar from "@mui/material/Snackbar";
import CheckCircleOutlined from "@mui/icons-material/CheckCircleOutlined";
import CloseOutlined from "@mui/icons-material/CloseOutlined";
import ErrorOutlineOutlined from "@mui/icons-material/ErrorOutlineOutlined";
import InfoOutlined from "@mui/icons-material/InfoOutlined";
import UndoOutlined from "@mui/icons-material/UndoOutlined";
import VisibilityOutlined from "@mui/icons-material/VisibilityOutlined";
import WarningAmberOutlined from "@mui/icons-material/WarningAmberOutlined";
import { AppTooltip } from "@/components/ui/common/AppTooltip";
import { useT } from "@/contexts/I18nContext";
import { ToastActionKind, ToastSeverity } from "@/enums";
import { ToastContext, useToastState } from "@/hooks/useToast";
import { REDUCED_MOTION, toastCountdown } from "@/styles/keyframes";

const TOAST_DURATION_MS = 4000;
const TOAST_WITH_ACTION_DURATION_MS = 7000;
const COUNTDOWN_CLASS = "toast-countdown";

const TOAST_TONES: Record<
  ToastSeverity,
  { color: string; Icon: typeof InfoOutlined }
> = {
  [ToastSeverity.Success]: {
    color: "var(--green)",
    Icon: CheckCircleOutlined,
  },
  [ToastSeverity.Error]: {
    color: "var(--red)",
    Icon: ErrorOutlineOutlined,
  },
  [ToastSeverity.Warning]: {
    color: "var(--yellow)",
    Icon: WarningAmberOutlined,
  },
  [ToastSeverity.Info]: {
    color: "var(--accent)",
    Icon: InfoOutlined,
  },
};

const ACTION_ICONS: Record<ToastActionKind, typeof InfoOutlined> = {
  [ToastActionKind.View]: VisibilityOutlined,
  [ToastActionKind.Undo]: UndoOutlined,
};

const SlideFromRight = (
  props: TransitionProps & { children: React.ReactElement },
) => <Slide {...props} direction="left" />;

const isUrgent = (severity: ToastSeverity) =>
  severity === ToastSeverity.Error || severity === ToastSeverity.Warning;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const t = useT();
  const { toast, actions, runAction } = useToastState();
  const { action } = toast;
  const ActionIcon = ACTION_ICONS[action?.kind ?? ToastActionKind.View];
  const tone = TOAST_TONES[toast.severity];
  const duration = action ? TOAST_WITH_ACTION_DURATION_MS : TOAST_DURATION_MS;

  return (
    <ToastContext.Provider value={actions}>
      {children}
      <Snackbar
        key={toast.id}
        open={toast.open}
        onClose={(_, reason) => reason !== "clickaway" && actions.closeToast()}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        slots={{ transition: SlideFromRight }}
      >
        <Box
          role={isUrgent(toast.severity) ? "alert" : "status"}
          sx={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            minWidth: { xs: "calc(100vw - 32px)", sm: "320px" },
            maxWidth: "420px",
            p: "12px 8px 12px 12px",
            overflow: "hidden",
            background: "var(--s1)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-md)",
            boxShadow: "var(--sh-3)",
            [`&:hover .${COUNTDOWN_CLASS}`]: { animationPlayState: "paused" },
          }}
        >
          <Box
            aria-hidden
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              color: tone.color,
            }}
          >
            <tone.Icon sx={{ fontSize: 20 }} />
          </Box>

          <Box
            sx={{
              flex: 1,
              minWidth: 0,
              fontSize: "13px",
              fontWeight: 500,
              lineHeight: 1.4,
              color: "var(--text)",
            }}
          >
            {toast.message}
          </Box>

          {action && (
            <AppTooltip title={action.label}>
              <IconButton
                size="small"
                aria-label={action.label}
                onClick={runAction}
                sx={{
                  flexShrink: 0,
                  color: "var(--accent)",
                  "&:hover": {
                    background: "var(--accent-subtle)",
                    color: "var(--accent)",
                  },
                }}
              >
                <ActionIcon sx={{ fontSize: 17 }} />
              </IconButton>
            </AppTooltip>
          )}

          <IconButton
            size="small"
            aria-label={t("common.close")}
            onClick={actions.closeToast}
            sx={{ flexShrink: 0 }}
          >
            <CloseOutlined sx={{ fontSize: 16 }} />
          </IconButton>

          <Box
            aria-hidden
            className={COUNTDOWN_CLASS}
            onAnimationEnd={actions.closeToast}
            sx={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: "2px",
              background: tone.color,
              opacity: 0.55,
              transformOrigin: "left center",
              animation: `${toastCountdown} ${duration}ms linear forwards`,
              [REDUCED_MOTION]: { opacity: 0 },
            }}
          />
        </Box>
      </Snackbar>
    </ToastContext.Provider>
  );
};
