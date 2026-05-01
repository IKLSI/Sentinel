import React, { useState } from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import { CUSTOM_COLUMN_COLORS } from "../../helpers";

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
    <Dialog
      open={open}
      onClose={handleClose}
      slotProps={{
        paper: {
          sx: {
            background: "var(--s1)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r)",
            minWidth: 340,
          },
        },
      }}
    >
      <DialogTitle
        sx={{ fontSize: "13px", fontWeight: 700, color: "var(--text)", pb: 1 }}
      >
        Nouvelle colonne
      </DialogTitle>
      <DialogContent sx={{ pb: 1 }}>
        <TextField
          autoFocus
          fullWidth
          size="small"
          placeholder="Nom de la colonne"
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, 50))}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
          }}
          sx={{
            mb: 2,
            "& .MuiOutlinedInput-root": {
              fontSize: "13px",
              background: "var(--s2)",
            },
          }}
          slotProps={{ htmlInput: { maxLength: 50 } }}
          helperText={`${name.length}/50`}
        />
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
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button
          size="small"
          onClick={handleClose}
          sx={{ fontSize: "12px", color: "var(--muted2)" }}
        >
          Annuler
        </Button>
        <Button
          size="small"
          variant="contained"
          disabled={!name.trim() || loading}
          onClick={handleSubmit}
          sx={{ fontSize: "12px" }}
        >
          Créer
        </Button>
      </DialogActions>
    </Dialog>
  );
};
