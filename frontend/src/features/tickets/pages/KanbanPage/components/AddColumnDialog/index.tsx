import React, { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import { AppModal } from "@/components/AppModal";
import { CUSTOM_COLUMN_COLORS } from "../../helpers";

const modalInputSx = {
  background: "var(--s1)",
  border: "1px solid var(--border)",
  borderRadius: "var(--r)",
  px: "12px",
  py: "8px",
  fontSize: "13px",
  color: "var(--text)",
  width: "100%",
  outline: "none",
  fontFamily: "inherit",
};

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Box
    component="label"
    sx={{
      display: "block",
      fontSize: "11px",
      fontWeight: 600,
      mb: "5px",
      color: "var(--muted2)",
      letterSpacing: "0.04em",
    }}
  >
    {children}
  </Box>
);

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (name: string, color: string) => Promise<void>;
}

export const AddColumnDialog: React.FC<Props> = ({ open, onClose, onConfirm }) => {
  const [name, setName] = useState("");
  const [color, setColor] = useState(CUSTOM_COLUMN_COLORS[0]);
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    setName("");
    setColor(CUSTOM_COLUMN_COLORS[0]);
    onClose();
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await onConfirm(name.trim(), color);
      setName("");
      setColor(CUSTOM_COLUMN_COLORS[0]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppModal
      open={open}
      onClose={handleClose}
      title="Nouvelle colonne"
      maxWidth="xs"
      actions={
        <>
          <Button
            variant="contained"
            size="small"
            className="btn-cancel"
            sx={{ textTransform: "none" }}
            onClick={handleClose}
          >
            Annuler
          </Button>
          <Button
            variant="contained"
            size="small"
            disabled={!name.trim() || loading}
            onClick={handleSubmit}
            sx={{
              textTransform: "none",
              background:
                "linear-gradient(135deg, var(--accent) 0%, color-mix(in srgb, var(--accent) 92%, white) 100%)",
              boxShadow: "none",
              "&:hover": {
                background:
                  "linear-gradient(135deg, color-mix(in srgb, var(--accent) 85%, black) 0%, var(--accent) 100%)",
                boxShadow: "none",
                transform: "none",
              },
            }}
          >
            {loading ? (
              <CircularProgress size={14} sx={{ color: "var(--s1)" }} />
            ) : (
              "Créer"
            )}
          </Button>
        </>
      }
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        <Box>
          <Label>
            NOM{" "}
            <Box component="span" sx={{ color: "var(--red)" }}>
              *
            </Box>
          </Label>
          <Box
            component="input"
            autoFocus
            type="text"
            placeholder="Nom de la colonne"
            value={name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setName(e.target.value.slice(0, 50))
            }
            onKeyDown={(e: React.KeyboardEvent) => {
              if (e.key === "Enter") handleSubmit();
            }}
            maxLength={50}
            sx={modalInputSx}
          />
        </Box>
        <Box>
          <Label>COULEUR</Label>
          <Box sx={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {CUSTOM_COLUMN_COLORS.map((c) => (
              <Box
                key={c}
                onClick={() => setColor(c)}
                sx={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: c,
                  cursor: "pointer",
                  border: color === c ? "2px solid var(--text)" : "2px solid transparent",
                  outline: color === c ? "2px solid var(--s1)" : "none",
                  outlineOffset: "-3px",
                  transition: "border-color 0.12s",
                }}
              />
            ))}
          </Box>
        </Box>
      </Box>
    </AppModal>
  );
};
