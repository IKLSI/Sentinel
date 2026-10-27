import type React from "react";
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
  <Button
    type={onClick ? "button" : "submit"}
    variant="contained"
    size="large"
    fullWidth
    disabled={loading}
    onClick={onClick}
    sx={{ mt: spaced ? "24px" : "6px" }}
  >
    {loading ? <CircularProgress size={18} color="inherit" /> : children}
  </Button>
);
