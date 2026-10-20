import type React from "react";
import ButtonBase from "@mui/material/ButtonBase";

interface Props {
  label: string;
  onClick: () => void;
}

export const CardLink: React.FC<Props> = ({ label, onClick }) => (
  <ButtonBase
    onClick={onClick}
    sx={{
      fontSize: "12px",
      fontWeight: 600,
      color: "var(--accent)",
      borderRadius: "var(--r-xs)",
      whiteSpace: "nowrap",
      "&:hover": { textDecoration: "underline" },
      "&.Mui-focusVisible": { outline: "2px solid var(--accent)" },
    }}
  >
    {label}
  </ButtonBase>
);
