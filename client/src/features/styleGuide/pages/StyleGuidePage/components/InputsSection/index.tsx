import type React from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import SearchOutlined from "@mui/icons-material/SearchOutlined";
import { Section } from "@/features/styleGuide/pages/StyleGuidePage/components/Section";
import { SubLabel } from "@/features/styleGuide/pages/StyleGuidePage/components/SubLabel";

export const InputsSection: React.FC = () => {
  return (
    <Section title="Inputs">
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          maxWidth: "380px",
        }}
      >
        <Box>
          <SubLabel>Default</SubLabel>
          <TextField
            fullWidth
            size="small"
            placeholder="Rechercher un projet…"
          />
        </Box>
        <Box>
          <SubLabel>With icon</SubLabel>
          <TextField
            fullWidth
            size="small"
            placeholder="Rechercher…"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchOutlined
                      sx={{ fontSize: 16, color: "var(--muted)" }}
                    />
                  </InputAdornment>
                ),
              },
            }}
          />
        </Box>
        <Box>
          <SubLabel>Disabled</SubLabel>
          <TextField
            fullWidth
            size="small"
            placeholder="Champ désactivé"
            disabled
          />
        </Box>
        <Box>
          <SubLabel>Textarea</SubLabel>
          <TextField
            fullWidth
            multiline
            minRows={3}
            placeholder="Décrivez le ticket…"
          />
        </Box>
      </Box>
    </Section>
  );
};
