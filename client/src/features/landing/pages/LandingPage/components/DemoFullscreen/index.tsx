import type React from "react";
import { useEffect, useRef } from "react";
import Backdrop from "@mui/material/Backdrop";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Modal from "@mui/material/Modal";
import CloseOutlined from "@mui/icons-material/CloseOutlined";
import { useT } from "@/contexts/I18nContext";
import {
  DEMO_CANVAS_HEIGHT,
  DEMO_CANVAS_WIDTH,
  DEMO_FULLSCREEN_GUTTER,
} from "@/features/landing/demo/constants";
import { useWindowFitScale } from "@/features/landing/demo/hooks";
import type { DemoRouter } from "@/features/landing/demo/router";
import { DemoCanvas } from "@/features/landing/pages/LandingPage/components/DemoCanvas";
import { DemoScope } from "@/features/landing/pages/LandingPage/components/DemoScope";

interface Props {
  router: DemoRouter;
  onClose: () => void;
}

export const DemoFullscreen: React.FC<Props> = ({ router, onClose }) => {
  const t = useT();
  const scale = useWindowFitScale();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  const closeOnBackdrop = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      slots={{ backdrop: Backdrop }}
      slotProps={{
        backdrop: {
          sx: {
            background: "rgba(16, 17, 36, 0.55)",
            backdropFilter: "blur(6px)",
          },
        },
      }}
    >
      <Box
        role="dialog"
        aria-modal="true"
        aria-label={t("landing.demo.fullscreen_label")}
        onClick={closeOnBackdrop}
        sx={{
          position: "fixed",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: `${DEMO_FULLSCREEN_GUTTER / 2}px`,
          outline: "none",
        }}
      >
        <ButtonBase
          ref={closeRef}
          onClick={onClose}
          aria-label={t("landing.demo.close")}
          sx={{
            position: "absolute",
            top: "16px",
            right: "16px",
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: "#ffffff",
            color: "#101124",
            boxShadow: "0 4px 14px rgba(0, 0, 0, 0.2)",
            "&.Mui-focusVisible": { outline: "2px solid #5048e5" },
          }}
        >
          <CloseOutlined sx={{ fontSize: 22 }} />
        </ButtonBase>
        <DemoScope>
          <Box
            sx={{
              overflow: "hidden",
              borderRadius: "15px",
              boxShadow: "0 30px 80px rgba(0, 0, 0, 0.4)",
            }}
            style={{
              width: DEMO_CANVAS_WIDTH * scale,
              height: DEMO_CANVAS_HEIGHT * scale,
            }}
          >
            <DemoCanvas router={router} scale={scale} />
          </Box>
        </DemoScope>
      </Box>
    </Modal>
  );
};
