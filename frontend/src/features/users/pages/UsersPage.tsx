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

const inputStyle: React.CSSProperties = {
  background: "var(--s1)",
  border: "1px solid var(--border)",
  borderRadius: "var(--r)",
  padding: "8px 12px",
  fontSize: "13px",
  color: "var(--text)",
  width: "100%",
  outline: "none",
  fontFamily: "inherit",
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
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "60px",
            }}
          >
            <CircularProgress size={24} />
          </div>
        ) : (
          <div
            style={{
              background: "var(--s1)",
              border: "1px solid var(--border)",
              borderRadius: "var(--r)",
              overflow: "hidden",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
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
                    <th
                      key={h}
                      style={{
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
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        textAlign: "center",
                        padding: "40px",
                        color: "var(--muted)",
                        fontSize: "13px",
                      }}
                    >
                      Aucun utilisateur
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr
                      key={user.id}
                      onMouseEnter={(e) =>
                        Array.from(e.currentTarget.cells).forEach(
                          (c) => (c.style.background = "var(--s2)"),
                        )
                      }
                      onMouseLeave={(e) =>
                        Array.from(e.currentTarget.cells).forEach(
                          (c) => (c.style.background = "transparent"),
                        )
                      }
                    >
                      <td
                        style={{
                          padding: "12px 16px",
                          borderBottom: "1px solid var(--border)",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                          }}
                        >
                          <div
                            style={{
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
                          </div>
                          <span style={{ fontWeight: 600, fontSize: "13px" }}>
                            {user.firstName} {user.lastName}
                          </span>
                        </div>
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          borderBottom: "1px solid var(--border)",
                          fontFamily: "var(--font-mono)",
                          fontSize: "11px",
                          color: "var(--muted2)",
                        }}
                      >
                        {user.email}
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          borderBottom: "1px solid var(--border)",
                        }}
                      >
                        <StatusChip variant={roleVariants[user.role]}>
                          {roleLabels[user.role]}
                        </StatusChip>
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          borderBottom: "1px solid var(--border)",
                        }}
                      >
                        <StatusChip variant={user.isActive ? "green" : "gray"}>
                          {user.isActive ? "Actif" : "Inactif"}
                        </StatusChip>
                      </td>
                      <td
                        style={{
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
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          borderBottom: "1px solid var(--border)",
                        }}
                      >
                        <div style={{ display: "flex", gap: "6px" }}>
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
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
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
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "14px",
              }}
            >
              <div style={{ marginBottom: "14px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "11px",
                    fontWeight: 600,
                    marginBottom: "5px",
                    color: "var(--muted2)",
                    letterSpacing: "0.04em",
                  }}
                >
                  Prénom *
                </label>
                <input
                  type="text"
                  style={inputStyle}
                  value={form.firstName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, firstName: e.target.value }))
                  }
                />
              </div>
              <div style={{ marginBottom: "14px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "11px",
                    fontWeight: 600,
                    marginBottom: "5px",
                    color: "var(--muted2)",
                    letterSpacing: "0.04em",
                  }}
                >
                  Nom *
                </label>
                <input
                  type="text"
                  style={inputStyle}
                  value={form.lastName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, lastName: e.target.value }))
                  }
                />
              </div>
            </div>
            <div style={{ marginBottom: "14px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: 600,
                  marginBottom: "5px",
                  color: "var(--muted2)",
                  letterSpacing: "0.04em",
                }}
              >
                Email *
              </label>
              <input
                type="email"
                style={inputStyle}
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
              />
            </div>
            <div style={{ marginBottom: "14px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: 600,
                  marginBottom: "5px",
                  color: "var(--muted2)",
                  letterSpacing: "0.04em",
                }}
              >
                Rôle
              </label>
              <select
                style={inputStyle}
                value={form.role}
                onChange={(e) =>
                  setForm((f) => ({ ...f, role: e.target.value as UserRole }))
                }
              >
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="technician">Technicien</option>
              </select>
            </div>
            <div style={{ marginBottom: "14px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: 600,
                  marginBottom: "5px",
                  color: "var(--muted2)",
                  letterSpacing: "0.04em",
                }}
              >
                Mot de passe temporaire *
              </label>
              <input
                type="password"
                style={inputStyle}
                value={form.password}
                onChange={(e) =>
                  setForm((f) => ({ ...f, password: e.target.value }))
                }
              />
            </div>
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
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "14px",
            }}
          >
            <div style={{ marginBottom: "14px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: 600,
                  marginBottom: "5px",
                  color: "var(--muted2)",
                  letterSpacing: "0.04em",
                }}
              >
                Prénom
              </label>
              <input
                type="text"
                style={inputStyle}
                value={editForm.firstName}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, firstName: e.target.value }))
                }
              />
            </div>
            <div style={{ marginBottom: "14px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: 600,
                  marginBottom: "5px",
                  color: "var(--muted2)",
                  letterSpacing: "0.04em",
                }}
              >
                Nom
              </label>
              <input
                type="text"
                style={inputStyle}
                value={editForm.lastName}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, lastName: e.target.value }))
                }
              />
            </div>
          </div>
          <div>
            <label
              style={{
                display: "block",
                fontSize: "11px",
                fontWeight: 600,
                marginBottom: "5px",
                color: "var(--muted2)",
                letterSpacing: "0.04em",
              }}
            >
              Rôle
            </label>
            <select
              style={inputStyle}
              value={editForm.role}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, role: e.target.value as UserRole }))
              }
            >
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="technician">Technicien</option>
            </select>
          </div>
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
