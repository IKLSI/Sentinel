import type React from "react";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import OpenInFullOutlined from "@mui/icons-material/OpenInFullOutlined";
import { useT } from "@/contexts/I18nContext";

interface Props {
  onClick: () => void;
}

export const DemoFullscreenButton: React.FC<Props> = ({ onClick }) => {
  const t = useT();

  return (
    <Box sx={{ display: "flex", justifyContent: "center", mt: "20px" }}>
      <ButtonBase
        onClick={onClick}
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          px: "14px",
          py: "7px",
          borderRadius: "999px",
          fontFamily: "inherit",
          fontSize: "14px",
          fontWeight: 500,
          color: "var(--ink)",
          background: "var(--page)",
          boxShadow: "0 0 0 1px var(--line)",
          "&:hover": { background: "var(--tint)" },
          "&.Mui-focusVisible": { outline: "2px solid var(--indigo)" },
        }}
      >
        <OpenInFullOutlined aria-hidden sx={{ fontSize: 16 }} />
        {t("landing.demo.open_fullscreen")}
      </ButtonBase>
    </Box>
  );
};
