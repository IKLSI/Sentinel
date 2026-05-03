import React, { useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import SearchOutlined from "@mui/icons-material/SearchOutlined";
import FolderOutlined from "@mui/icons-material/FolderOutlined";
import CheckOutlined from "@mui/icons-material/CheckOutlined";
import { useT } from "@/i18n/I18nContext";
import {
  ProjectInfo,
  getAvatarColor,
  projectInitials,
  toggleItem,
} from "../../helpers";

interface Props {
  open: boolean;
  onClose: () => void;
  allProjects: ProjectInfo[];
  selected: string[];
  onApply: (projects: string[]) => void;
}

export const ProjectPicker: React.FC<Props> = ({
  open,
  onClose,
  allProjects,
  selected,
  onApply,
}) => {
  const t = useT();
  const [search, setSearch] = useState("");
  const [pending, setPending] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setPending(selected);
      setSearch("");
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open, selected]);

  const visible = allProjects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  const toggle = (name: string) => setPending((prev) => toggleItem(prev, name));

  const selectAll = () => {
    const names = visible.map((p) => p.name);
    const allSel = names.every((n) => pending.includes(n));
    setPending((prev) =>
      allSel
        ? prev.filter((n) => !names.includes(n))
        : [...new Set([...prev, ...names])],
    );
  };

  const handleApply = () => {
    onApply(pending);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            bgcolor: "var(--s1)",
            border: "1px solid",
            borderColor: "divider",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            maxHeight: "600px",
          },
        },
      }}
    >
      <Box
        sx={{
          fontSize: "14px",
          fontWeight: 700,
          letterSpacing: "-0.02em",
          p: "16px 24px",
          borderBottom: "1px solid var(--border)",
          background:
            "linear-gradient(135deg, var(--accent-subtle) 0%, var(--s2) 60%)",
          flexShrink: 0,
          color: "var(--text)",
        }}
      >
        {t("tickets.kanban.picker.title")}
      </Box>

      <Box sx={{ px: "20px", pt: "16px", pb: "0", flexShrink: 0 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "var(--bg)",
            border: "1px solid var(--border)",
            borderRadius: 'var(--r)',
            px: "10px",
            height: "32px",
            transition: "border-color 0.15s, box-shadow 0.15s",
            "&:focus-within": {
              borderColor: "var(--accent-border)",
              boxShadow: "0 0 0 3px var(--accent-subtle)",
            },
          }}
        >
          <SearchOutlined
            sx={{ color: "var(--muted)", fontSize: "14px", flexShrink: 0 }}
          />
          <Box
            component="input"
            ref={inputRef}
            placeholder={t("tickets.kanban.search_placeholder")}
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSearch(e.target.value)
            }
            onKeyDown={(e: React.KeyboardEvent) => {
              if (e.key === "Escape") onClose();
            }}
            aria-label={t("tickets.kanban.picker.search_aria")}
            sx={{
              all: "unset",
              flex: 1,
              fontSize: "12.5px",
              color: "var(--text)",
              "&::placeholder": { color: "var(--muted)" },
              "&:focus": { outline: "none", boxShadow: "none !important" },
            }}
          />
        </Box>
      </Box>

      <Box
        sx={{
          px: "20px",
          pt: "14px",
          pb: "6px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <Box
          sx={{
            fontSize: "11px",
            fontWeight: 700,
            color: "var(--text)",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          {t("tickets.kanban.picker.projects_label")}
        </Box>
        <Box
          component="button"
          onClick={selectAll}
          sx={{
            border: "none",
            background: "transparent",
            color: "var(--accent)",
            fontSize: "12px",
            fontWeight: 600,
            cursor: "pointer",
            outline: "none",
            "&:hover": { textDecoration: "underline" },
          }}
        >
          {t("tickets.kanban.picker.select_all")}
        </Box>
      </Box>

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          px: "12px",
          pb: "8px",
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        {visible.length === 0 ? (
          <Box
            sx={{
              py: "40px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <FolderOutlined
              sx={{ fontSize: "28px", color: "var(--muted2)", opacity: 0.4 }}
            />
            <Box
              sx={{ fontSize: "13px", color: "var(--muted)", fontWeight: 500 }}
            >
              {t("tickets.kanban.no_results")}
            </Box>
          </Box>
        ) : (
          visible.map((project) => {
            const isSelected = pending.includes(project.name);
            const color = getAvatarColor(project.name);
            const initials = projectInitials(project.name);
            return (
              <Box
                key={project.name}
                onClick={() => toggle(project.name)}
                onMouseDown={(e) => e.preventDefault()}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: "11px",
                  px: "10px",
                  py: "9px",
                  borderRadius: 'var(--r)',
                  mb: "2px",
                  background: isSelected
                    ? "var(--accent-subtle)"
                    : "transparent",
                  cursor: "pointer",
                  userSelect: "none",
                  "&:hover": {
                    background: isSelected
                      ? "color-mix(in srgb, var(--accent) 11%, transparent)"
                      : "var(--s2)",
                  },
                  transition: "background 0.1s",
                }}
              >
                <Box
                  sx={{
                    width: "36px",
                    height: "36px",
                    borderRadius: 'var(--r)',
                    background: color,
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "var(--s1)",
                    fontFamily: "var(--font-mono)",
                    letterSpacing: "0.04em",
                  }}
                >
                  {initials}
                </Box>

                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box
                    sx={{
                      fontSize: "13px",
                      fontWeight: isSelected ? 600 : 500,
                      color: "var(--text)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {project.name}
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      mt: "2px",
                    }}
                  >
                    <Box sx={{ fontSize: "11.5px", color: "var(--muted2)" }}>
                      {project.ticketCount}{" "}
                      {project.ticketCount !== 1
                        ? t("tickets.kanban.picker.tickets_plural")
                        : t("tickets.kanban.picker.tickets_singular")}
                    </Box>
                  </Box>
                </Box>

                <Box
                  sx={{
                    width: "16px",
                    height: "16px",
                    borderRadius: 'var(--r-xs)',
                    flexShrink: 0,
                    border: isSelected ? "none" : "1.5px solid var(--border2)",
                    background: isSelected ? "var(--accent)" : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.15s",
                  }}
                >
                  {isSelected && (
                    <CheckOutlined
                      sx={{ fontSize: "11px", color: "var(--s1)" }}
                    />
                  )}
                </Box>
              </Box>
            );
          })
        )}
      </Box>

      <Box
        sx={{
          p: "14px 20px",
          borderTop: "1px solid var(--border)",
          background: "var(--s2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
          gap: "8px",
        }}
      >
        <Box
          sx={{ fontSize: "12.5px", color: "var(--muted2)", fontWeight: 500 }}
        >
          {pending.length !== 1
            ? t("tickets.kanban.picker.selected_plural", {
                count: pending.length,
              })
            : t("tickets.kanban.picker.selected_singular", {
                count: pending.length,
              })}
        </Box>
        <Box sx={{ display: "flex", gap: "8px" }}>
          <Button
            variant="contained"
            size="small"
            sx={{
              textTransform: "none",
              background:
                "linear-gradient(135deg, var(--red) 0%, color-mix(in srgb, var(--red) 92%, white) 100%)",
              boxShadow: "none",
              "&:hover": {
                background:
                  "linear-gradient(135deg, color-mix(in srgb, var(--red) 85%, black) 0%, var(--red) 100%)",
                boxShadow: "none",
                transform: "none",
              },
            }}
            onClick={() => setPending([])}
          >
            {t("tickets.kanban.picker.reset")}
          </Button>
          <Button
            variant="contained"
            size="small"
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
            onClick={handleApply}
          >
            {t("tickets.kanban.picker.apply")}
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
};
