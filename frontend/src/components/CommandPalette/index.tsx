import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Modal from "@mui/material/Modal";
import SearchOutlined from "@mui/icons-material/SearchOutlined";
import ConfirmationNumberOutlined from "@mui/icons-material/ConfirmationNumberOutlined";
import CloudDownloadOutlined from "@mui/icons-material/CloudDownloadOutlined";
import PersonAddOutlined from "@mui/icons-material/PersonAddOutlined";
import RadarOutlined from "@mui/icons-material/RadarOutlined";
import KeyboardReturnOutlined from "@mui/icons-material/KeyboardReturnOutlined";
import { useT } from "@/i18n/I18nContext";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { UserRole } from "@/types/enums";
import { ROUTES } from "@/constants/routes";
import { useTriggerTechHealthScan } from "@/features/settings/hooks/useJobs";
import { extractApiError } from "@/utils/apiError";

export const PALETTE_OPEN_EVENT = "command-palette:open";
export const SETTINGS_OPEN_INVITE_EVENT = "settings:open-invite";

interface PaletteItem {
  id: string;
  group: string;
  labelKey: string;
  hintKey?: string;
  icon: React.ElementType;
  perform: () => void;
  roles?: Array<UserRole>;
}

export const CommandPalette: React.FC = () => {
  const t = useT();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const triggerScanMutation = useTriggerTechHealthScan();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActiveIdx(0);
  }, []);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(PALETTE_OPEN_EVENT, onOpen);
    return () => {
      window.removeEventListener(PALETTE_OPEN_EVENT, onOpen);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIdx(0);
      const id = window.setTimeout(() => inputRef.current?.focus(), 30);
      return () => window.clearTimeout(id);
    }
  }, [open]);

  const isAdmin = user?.role === UserRole.Admin;

  const allItems: PaletteItem[] = useMemo(() => {
    const items: PaletteItem[] = [
      {
        id: "create-ticket",
        group: "palette.section_actions",
        labelKey: "palette.action_create_ticket",
        hintKey: "palette.action_create_ticket_hint",
        icon: ConfirmationNumberOutlined,
        perform: () => {
          close();
          navigate(ROUTES.TICKETS, { state: { openCreate: true } });
        },
      },
      {
        id: "import-project",
        group: "palette.section_actions",
        labelKey: "palette.action_import_project",
        hintKey: "palette.action_import_project_hint",
        icon: CloudDownloadOutlined,
        perform: () => {
          close();
          navigate(ROUTES.PROJECTS, { state: { openImport: true } });
        },
        roles: [UserRole.Admin, UserRole.Developer],
      },
      {
        id: "invite-member",
        group: "palette.section_actions",
        labelKey: "palette.action_invite_member",
        hintKey: "palette.action_invite_member_hint",
        icon: PersonAddOutlined,
        perform: () => {
          close();
          navigate(ROUTES.SETTINGS);
          window.setTimeout(
            () => window.dispatchEvent(new Event(SETTINGS_OPEN_INVITE_EVENT)),
            50,
          );
        },
        roles: [UserRole.Admin],
      },
      {
        id: "trigger-scan",
        group: "palette.section_actions",
        labelKey: "palette.action_trigger_scan",
        hintKey: "palette.action_trigger_scan_hint",
        icon: RadarOutlined,
        perform: () => {
          close();
          triggerScanMutation.mutate(undefined, {
            onSuccess: () =>
              showToast(t("projects.toast.scan_started"), "success"),
            onError: (err) =>
              showToast(
                extractApiError(err, t("projects.toast.scan_start_error")),
                "error",
              ),
          });
        },
        roles: [UserRole.Admin],
      },
    ];
    return items.filter((it) => {
      if (!it.roles) return true;
      if (isAdmin) return it.roles.includes(UserRole.Admin);
      return it.roles.includes(UserRole.Developer);
    });
  }, [isAdmin, navigate, close, showToast, t, triggerScanMutation]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allItems;
    return allItems.filter((it) => {
      const label = t(it.labelKey).toLowerCase();
      const hint = it.hintKey ? t(it.hintKey).toLowerCase() : "";
      const group = t(it.group).toLowerCase();
      return label.includes(q) || hint.includes(q) || group.includes(q);
    });
  }, [allItems, query, t]);

  useEffect(() => {
    if (activeIdx >= filtered.length) setActiveIdx(0);
  }, [filtered.length, activeIdx]);

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLDivElement>(
      `[data-idx="${activeIdx}"]`,
    );
    if (el) el.scrollIntoView({ block: "nearest" });
  }, [activeIdx]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => (filtered.length ? (i + 1) % filtered.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) =>
        filtered.length ? (i - 1 + filtered.length) % filtered.length : 0,
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = filtered[activeIdx];
      if (target) target.perform();
    } else if (e.key === "Escape") {
      e.preventDefault();
      close();
    }
  };

  const groups: { key: string; items: PaletteItem[] }[] = useMemo(() => {
    const order = ["palette.section_actions"];
    const map = new Map<string, PaletteItem[]>();
    for (const it of filtered) {
      if (!map.has(it.group)) map.set(it.group, []);
      map.get(it.group)?.push(it);
    }
    return order
      .filter((k) => map.has(k))
      .map((k) => ({ key: k, items: map.get(k) ?? [] }));
  }, [filtered]);

  let runningIdx = -1;

  return (
    <Modal
      open={open}
      onClose={close}
      slotProps={{
        backdrop: {
          sx: {
            background: "var(--overlay)",
            backdropFilter: "blur(4px)",
          },
        },
      }}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        outline: "none",
      }}
    >
      <Box
        sx={{
          width: "min(620px, 92vw)",
          background: "var(--s1)",
          border: "1px solid var(--border)",
          borderRadius: "var(--r-xl)",
          boxShadow:
            "0 24px 80px rgba(0,0,0,0.45), 0 4px 16px rgba(0,0,0,0.25)",
          overflow: "hidden",
          outline: "none",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            px: "16px",
            height: "52px",
            borderBottom: "1px solid var(--border)",
            background:
              "linear-gradient(135deg, var(--accent-subtle) 0%, var(--s1) 70%)",
          }}
        >
          <SearchOutlined sx={{ fontSize: 18, color: "var(--muted)" }} />
          <Box
            component="input"
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setQuery(e.target.value)
            }
            onKeyDown={onKeyDown}
            placeholder={t("palette.placeholder")}
            sx={{
              flex: 1,
              border: "none",
              outline: "none",
              background: "transparent",
              color: "var(--text)",
              fontSize: "14px",
              fontWeight: 500,
              "::placeholder": { color: "var(--muted)" },
              "&:focus": {
                border: "none !important",
                boxShadow: "none !important",
              },
            }}
          />
        </Box>

        <Box
          ref={listRef}
          sx={{
            maxHeight: "52vh",
            overflowY: "auto",
            p: "6px 6px 8px",
          }}
        >
          {groups.length === 0 ? (
            <Box
              sx={{
                p: "24px 16px",
                textAlign: "center",
                color: "var(--muted)",
                fontSize: "12px",
                fontStyle: "italic",
              }}
            >
              {t("palette.empty")}
            </Box>
          ) : (
            groups.map((g) => (
              <Box key={g.key} sx={{ mb: "4px" }}>
                <Box
                  sx={{
                    px: "12px",
                    pt: "10px",
                    pb: "4px",
                    fontSize: "10px",
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "var(--muted2)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {t(g.key)}
                </Box>
                {g.items.map((it) => {
                  runningIdx += 1;
                  const idx = runningIdx;
                  const isActive = idx === activeIdx;
                  const Icon = it.icon;
                  return (
                    <Box
                      key={it.id}
                      data-idx={idx}
                      onMouseEnter={() => setActiveIdx(idx)}
                      onClick={() => it.perform()}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        px: "12px",
                        py: "8px",
                        mx: "4px",
                        borderRadius: "var(--r)",
                        cursor: "pointer",
                        background: isActive
                          ? "var(--accent-subtle)"
                          : "transparent",
                        color: isActive
                          ? "var(--text)"
                          : "var(--text-secondary)",
                        transition: "background 0.08s, color 0.08s",
                      }}
                    >
                      <Icon
                        sx={{
                          fontSize: 16,
                          color: isActive ? "var(--accent)" : "var(--muted)",
                        }}
                      />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box
                          sx={{
                            fontSize: "13px",
                            fontWeight: 600,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {t(it.labelKey)}
                        </Box>
                        {it.hintKey && (
                          <Box
                            sx={{
                              fontSize: "10.5px",
                              color: "var(--muted)",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {t(it.hintKey)}
                          </Box>
                        )}
                      </Box>
                      {isActive && (
                        <KeyboardReturnOutlined
                          sx={{ fontSize: 14, color: "var(--muted)" }}
                        />
                      )}
                    </Box>
                  );
                })}
              </Box>
            ))
          )}
        </Box>
      </Box>
    </Modal>
  );
};
