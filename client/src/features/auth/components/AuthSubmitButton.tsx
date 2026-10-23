import type React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";

interface AuthSubmitButtonProps {
  children: React.ReactNode;
  loading?: boolean;
  spaced?: boolean;
  onClick?: () => void;
}

export const AuthSubmitButton: React.FC<AuthSubmitButtonProps> = ({
  children,
  loading = false,
  spaced = false,
  onClick,
}) => (
  <Box className="lp-submit" sx={spaced ? { mt: "24px" } : undefined}>
    <Button
      type={onClick ? "button" : "submit"}
      variant="contained"
      size="large"
      fullWidth
      disabled={loading}
      onClick={onClick}
    >
      {loading ? <CircularProgress size={18} color="inherit" /> : children}
    </Button>
  </Box>
);
