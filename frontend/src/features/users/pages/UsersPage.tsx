import React, { useState, useEffect, useCallback } from "react";
import { Topbar } from "../../../layouts/Topbar";
import { StatusChip } from "../../../components/StatusChip";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import AddOutlined from "@mui/icons-material/AddOutlined";
import Box from "@mui/material/Box";
import { getUsers, createUser, updateUser } from "../api/users";
import { useToast } from "../../../hooks/useToast";
import { User, UserRole } from "../../../types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const roleLabels: Record<UserRole, string> = {
  admin: "Admin",
  manager: "Manager",
  technician: "Technicien",
};

const roleVariants: Record<UserRole, "red" | "orange" | "blue"> = {
  admin: "red",
  manager: "orange",
  technician: "blue",
};

export const UsersPage: React.FC = () => {
  const { showToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "technician" as UserRole,
    password: "",
  });
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    role: "technician" as UserRole,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getUsers();
      setUsers(data.items);
    } catch {
      showToast("Impossible de charger les utilisateurs", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.email || !form.password) {
      showToast("Champs obligatoires manquants", "warning");
      return;
    }
    setSubmitting(true);
    try {
      await createUser(form);
      showToast("Utilisateur créé", "success");
      setCreateModalOpen(false);
      await load();
    } catch {
      showToast("Erreur lors de la création", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (user: User) => {
    setEditUser(user);
    setEditForm({
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    });
  };

  const handleEdit = async () => {
    if (!editUser) return;
    setSubmitting(true);
    try {
      await updateUser(editUser.id, editForm);
      showToast("Utilisateur modifié", "success");
      setEditUser(null);
      await load();
    } catch {
      showToast("Erreur lors de la modification", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (user: User) => {
    try {
      await updateUser(user.id, { isActive: !user.isActive });
      showToast(
        user.isActive ? "Utilisateur désactivé" : "Utilisateur réactivé",
        "success",
      );
      await load();
    } catch {
      showToast("Erreur lors de la mise à jour", "error");
    }
  };

  return (
    <>
      <Topbar
        title="Utilisateurs"
        subtitle={`${users.length} utilisateur(s)`}
        actions={
          <Button
            variant="contained"
            size="small"
            sx={{
              textTransform: "none",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
            onClick={() => {
              setForm({
                firstName: "",
                lastName: "",
                email: "",
                role: "technician",
                password: "",
              });
              setCreateModalOpen(true);
            }}
          >
            <AddOutlined sx={{ fontSize: 14 }} />
            Nouvel utilisateur
          </Button>
        }
      />
      <Box sx={{ p: "24px 28px" }}>
        {loading ? (
          <Box className="d-flex justify-content-center" sx={{ p: "60px" }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <Box
            sx={{
              background: "var(--s1)",
              border: "1px solid var(--border)",
              borderRadius: "var(--r)",
              overflow: "hidden",
            }}
          >
            <Box
              component="table"
              sx={{ width: "100%", borderCollapse: "collapse" }}
            >
              <thead>
                <tr>
                  {[
                    "Utilisateur",
                    "Email",
                    "Rôle",
                    "Statut",
                    "Depuis le",
                    "Actions",
                  ].map((h) => (
                    <Box
                      component="th"
                      key={h}
                      sx={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "9px",
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        color: "var(--muted)",
                        textAlign: "left",
                        padding: "10px 16px",
                        borderBottom: "1px solid var(--border)",
                        background: "var(--s2)",
                      }}
                    >
                      {h}
                    </Box>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <Box
                      component="td"
                      colSpan={6}
                      sx={{
                        textAlign: "center",
                        padding: "40px",
                        color: "var(--muted)",
                        fontSize: "13px",
                      }}
                    >
                      Aucun utilisateur
                    </Box>
                  </tr>
                ) : (
                  users.map((user) => (
                    <Box
                      component="tr"
                      key={user.id}
                      sx={{
                        "&:hover td": { background: "var(--s2)" },
                      }}
                    >
                      <Box
                        component="td"
                        sx={{
                          padding: "12px 16px",
                          borderBottom: "1px solid var(--border)",
                        }}
                      >
                        <Box className="d-flex align-items-center gap-2">
                          <Box
                            sx={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "50%",
                              background:
                                "linear-gradient(135deg, var(--accent), #818cf8)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "11px",
                              fontWeight: 700,
                              color: "#fff",
                              flexShrink: 0,
                            }}
                          >
                            {user.firstName[0]}
                            {user.lastName[0]}
                          </Box>
                          <Box
                            component="span"
                            sx={{ fontWeight: 600, fontSize: "13px" }}
                          >
                            {user.firstName} {user.lastName}
                          </Box>
                        </Box>
                      </Box>
                      <Box
                        component="td"
                        sx={{
                          padding: "12px 16px",
                          borderBottom: "1px solid var(--border)",
                          fontFamily: "var(--font-mono)",
                          fontSize: "11px",
                          color: "var(--muted2)",
                        }}
                      >
                        {user.email}
                      </Box>
                      <Box
                        component="td"
                        sx={{
                          padding: "12px 16px",
                          borderBottom: "1px solid var(--border)",
                        }}
                      >
                        <StatusChip variant={roleVariants[user.role]}>
                          {roleLabels[user.role]}
                        </StatusChip>
                      </Box>
                      <Box
                        component="td"
                        sx={{
                          padding: "12px 16px",
                          borderBottom: "1px solid var(--border)",
                        }}
                      >
                        <StatusChip variant={user.isActive ? "green" : "gray"}>
                          {user.isActive ? "Actif" : "Inactif"}
                        </StatusChip>
                      </Box>
                      <Box
                        component="td"
                        sx={{
                          padding: "12px 16px",
                          borderBottom: "1px solid var(--border)",
                          fontFamily: "var(--font-mono)",
                          fontSize: "11px",
                          color: "var(--muted)",
                        }}
                      >
                        {format(new Date(user.createdAt), "dd MMM yyyy", {
                          locale: fr,
                        })}
                      </Box>
                      <Box
                        component="td"
                        sx={{
                          padding: "12px 16px",
                          borderBottom: "1px solid var(--border)",
                        }}
                      >
                        <Box className="d-flex gap-2">
                          <Button
                            variant="outlined"
                            size="small"
                            sx={{ textTransform: "none" }}
                            onClick={() => openEdit(user)}
                          >
                            Modifier
                          </Button>
                          <Button
                            size="small"
                            sx={{
                              textTransform: "none",
                              background: user.isActive
                                ? "rgba(255,68,102,0.1)"
                                : "rgba(34,197,94,0.1)",
                              color: user.isActive
                                ? "var(--red)"
                                : "var(--green)",
                              border: `1px solid ${user.isActive ? "rgba(255,68,102,0.2)" : "rgba(34,197,94,0.2)"}`,
                            }}
                            onClick={() => handleToggleActive(user)}
                          >
                            {user.isActive ? "Désactiver" : "Réactiver"}
                          </Button>
                        </Box>
                      </Box>
                    </Box>
                  ))
                )}
              </tbody>
            </Box>
          </Box>
        )}
      </Box>

      <Dialog
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: "background.paper",
            border: "1px solid",
            borderColor: "divider",
          },
        }}
      >
        <DialogTitle sx={{ fontSize: "15px", fontWeight: 700, pb: 1 }}>
          Nouvel utilisateur
        </DialogTitle>
        <DialogContent sx={{ pt: "16px !important" }}>
          <form onSubmit={handleCreate}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "14px",
              }}
            >
              <Box sx={{ mb: "14px" }}>
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
                  Prénom *
                </Box>
                <Box
                  component="input"
                  type="text"
                  sx={{
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
                  }}
                  value={form.firstName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setForm((f) => ({ ...f, firstName: e.target.value }))
                  }
                />
              </Box>
              <Box sx={{ mb: "14px" }}>
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
                  Nom *
                </Box>
                <Box
                  component="input"
                  type="text"
                  sx={{
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
                  }}
                  value={form.lastName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setForm((f) => ({ ...f, lastName: e.target.value }))
                  }
                />
              </Box>
            </Box>
            <Box sx={{ mb: "14px" }}>
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
                Email *
              </Box>
              <Box
                component="input"
                type="email"
                sx={{
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
                }}
                value={form.email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
              />
            </Box>
            <Box sx={{ mb: "14px" }}>
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
                Rôle
              </Box>
              <Box
                component="select"
                sx={{
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
                }}
                value={form.role}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setForm((f) => ({ ...f, role: e.target.value as UserRole }))
                }
              >
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="technician">Technicien</option>
              </Box>
            </Box>
            <Box sx={{ mb: "14px" }}>
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
                Mot de passe temporaire *
              </Box>
              <Box
                component="input"
                type="password"
                sx={{
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
                }}
                value={form.password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setForm((f) => ({ ...f, password: e.target.value }))
                }
              />
            </Box>
          </form>
        </DialogContent>
        <DialogActions sx={{ p: "16px", pt: 0 }}>
          <Button
            variant="outlined"
            size="small"
            sx={{ textTransform: "none" }}
            onClick={() => setCreateModalOpen(false)}
          >
            Annuler
          </Button>
          <Button
            variant="contained"
            size="small"
            sx={{ textTransform: "none" }}
            onClick={handleCreate}
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={16} /> : "Créer"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={!!editUser}
        onClose={() => setEditUser(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: "background.paper",
            border: "1px solid",
            borderColor: "divider",
          },
        }}
      >
        <DialogTitle sx={{ fontSize: "15px", fontWeight: 700, pb: 1 }}>
          Modifier l'utilisateur
        </DialogTitle>
        <DialogContent sx={{ pt: "16px !important" }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "14px",
            }}
          >
            <Box sx={{ mb: "14px" }}>
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
                Prénom
              </Box>
              <Box
                component="input"
                type="text"
                sx={{
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
                }}
                value={editForm.firstName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditForm((f) => ({ ...f, firstName: e.target.value }))
                }
              />
            </Box>
            <Box sx={{ mb: "14px" }}>
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
                Nom
              </Box>
              <Box
                component="input"
                type="text"
                sx={{
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
                }}
                value={editForm.lastName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditForm((f) => ({ ...f, lastName: e.target.value }))
                }
              />
            </Box>
          </Box>
          <Box>
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
              Rôle
            </Box>
            <Box
              component="select"
              sx={{
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
              }}
              value={editForm.role}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setEditForm((f) => ({
                  ...f,
                  role: e.target.value as UserRole,
                }))
              }
            >
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="technician">Technicien</option>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: "16px", pt: 0 }}>
          <Button
            variant="outlined"
            size="small"
            sx={{ textTransform: "none" }}
            onClick={() => setEditUser(null)}
          >
            Annuler
          </Button>
          <Button
            variant="contained"
            size="small"
            sx={{ textTransform: "none" }}
            onClick={handleEdit}
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={16} /> : "Sauvegarder"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
