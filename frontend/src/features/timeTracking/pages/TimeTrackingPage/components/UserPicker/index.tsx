import React, { useEffect, useMemo, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import SearchOutlined from "@mui/icons-material/SearchOutlined";
import CheckOutlined from "@mui/icons-material/CheckOutlined";
import PersonOutlineOutlined from "@mui/icons-material/PersonOutlineOutlined";
import GroupsOutlined from "@mui/icons-material/GroupsOutlined";
import { useT } from "@/i18n/I18nContext";
import {
  getCurrentUserAvatar,
  getUserAvatar,
  getUserInitials,
} from "../../helpers";

type UserOption = {
  id: string;
  name: string;
  role?: string;
};

interface Props {
  open: boolean;
  onClose: () => void;
  users: UserOption[];
  selected: string;
  onApply: (userId: string) => void;
  currentUserId?: string;
}

export const UserPicker: React.FC<Props> = ({
  open,
  onClose,
  users,
  selected,
  onApply,
  currentUserId,
}) => {
  const t = useT();
  const [search, setSearch] = useState("");
  const [pending, setPending] = useState("all");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setPending(selected || "all");
      setSearch("");
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open, selected]);

  const visibleUsers = useMemo(
    () =>
      users.filter((u) => u.name.toLowerCase().includes(search.toLowerCase())),
    [users, search],
  );

  const options = useMemo(
    () => [
      {
        id: "all",
        name: t("time_tracking.user_filter_all"),
        icon: <GroupsOutlined sx={{ fontSize: "17px", color: "var(--s1)" }} />,
      },
      ...visibleUsers.map((u) => {
        const isOwn = u.id === currentUserId;
        const avatar = isOwn ? getCurrentUserAvatar() : getUserAvatar();
        return {
          id: u.id,
          name: isOwn ? t("time_tracking.you") : u.name,
          icon: (
            <Box
              sx={{
                width: "100%",
                height: "100%",
                borderRadius: 'var(--r)',
                background: avatar.bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "10px",
                fontWeight: 700,
                color: avatar.text,
                letterSpacing: "0.03em",
              }}
            >
              {getUserInitials(u.name)}
            </Box>
          ),
        };
      }),
    ],
    [visibleUsers, currentUserId, t],
  );

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
        {t("time_tracking.user_filter_title")}
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
            placeholder={t("time_tracking.user_filter_search_placeholder")}
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSearch(e.target.value)
            }
            onKeyDown={(e: React.KeyboardEvent) => {
              if (e.key === "Escape") onClose();
            }}
            aria-label={t("time_tracking.user_filter_search_aria")}
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
          {t("time_tracking.user_filter_users_label")}
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
        {options.length === 1 ? (
          <Box
            sx={{
              py: "40px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <PersonOutlineOutlined
              sx={{ fontSize: "28px", color: "var(--muted2)", opacity: 0.4 }}
            />
            <Box
              sx={{ fontSize: "13px", color: "var(--muted)", fontWeight: 500 }}
            >
              {t("tickets.kanban.no_results")}
            </Box>
          </Box>
        ) : (
          options.map((option) => {
            const isSelected = pending === option.id;
            return (
              <Box
                key={option.id}
                onClick={() => setPending(option.id)}
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
                    background:
                      option.id === "all"
                        ? "linear-gradient(135deg, var(--accent) 0%, color-mix(in srgb, var(--accent) 82%, white) 100%)"
                        : "transparent",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                  }}
                >
                  {option.icon}
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
                    {option.name}
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
          justifyContent: "flex-end",
          flexShrink: 0,
          gap: "8px",
        }}
      >
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
            onClick={() => setPending(currentUserId ?? "all")}
          >
            {t("time_tracking.user_filter_reset_self")}
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
