import type React from "react";
import { useId, useState } from "react";
import { useForm } from "react-hook-form";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import SearchOutlined from "@mui/icons-material/SearchOutlined";
import { useT } from "@/contexts/I18nContext";
import { FormSelectField } from "@/components/ui/forms/FormSelectField";
import { FormTextField } from "@/components/ui/forms/FormTextField";
import { PasswordTextField } from "@/components/ui/forms/PasswordTextField";
import { Section } from "@/features/styleGuide/pages/StyleGuidePage/components/Section";
import { SubLabel } from "@/features/styleGuide/pages/StyleGuidePage/components/SubLabel";

const DEMO_ERROR = { type: "manual", message: "auth.login.fill_all_fields" };

export const InputsSection: React.FC = () => {
  const t = useT();
  const { register } = useForm<{
    name: string;
    email: string;
    password: string;
    role: string;
  }>();
  const [showPassword, setShowPassword] = useState(false);
  const nameId = useId();
  const emailId = useId();
  const passwordId = useId();
  const roleId = useId();

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
          <SubLabel>Form field — FormTextField</SubLabel>
          <FormTextField
            id={nameId}
            label="Nom du projet"
            registration={register("name")}
            t={t}
            placeholder="Sentinel API"
            required
          />
        </Box>
        <Box>
          <SubLabel>Password — PasswordTextField</SubLabel>
          <PasswordTextField
            id={passwordId}
            label="Mot de passe"
            registration={register("password")}
            t={t}
            placeholder="••••••••••"
            showPassword={showPassword}
            onToggleShow={() => setShowPassword((value) => !value)}
            showLabel={t("auth.login.password_show")}
            hideLabel={t("auth.login.password_hide")}
          />
        </Box>
        <Box>
          <SubLabel>Select — FormSelectField</SubLabel>
          <FormSelectField
            id={roleId}
            label="Rôle"
            registration={register("role")}
          >
            <option value="admin">Administrateur</option>
            <option value="developer">Développeur</option>
          </FormSelectField>
        </Box>
        <Box>
          <SubLabel>Error</SubLabel>
          <FormTextField
            id={emailId}
            label="Email"
            registration={register("email")}
            error={DEMO_ERROR}
            t={t}
            type="email"
            placeholder="vous@entreprise.fr"
          />
        </Box>
        <Box>
          <SubLabel>Search</SubLabel>
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
