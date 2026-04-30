import React from "react";
import Box from "@mui/material/Box";
import InventoryOutlined from "@mui/icons-material/InventoryOutlined";
import SearchOutlined from "@mui/icons-material/SearchOutlined";
import { StatusChip } from "@/components/StatusChip";
import { useT } from "@/i18n/I18nContext";
import { DependencyDto } from "@/features/techHealth/api/projects";
import { DEP_STATUS, TD, TH, TR } from "../../helpers";

interface Props {
  dependencies: DependencyDto[];
  filteredDeps: DependencyDto[];
  search: string;
  onSearchChange: (v: string) => void;
}

export const DependenciesTab: React.FC<Props> = ({
  dependencies,
  filteredDeps,
  search,
  onSearchChange,
}) => {
  const t = useT();

  if (dependencies.length === 0) {
    return (
      <Box className="empty-state">
        <InventoryOutlined className="empty-state-icon" sx={{ fontSize: 40 }} />
        <Box className="empty-state-title">
          {t("tech_health.empty.no_deps_title")}
        </Box>
        <Box className="empty-state-subtitle">
          {t("tech_health.empty.no_deps_subtitle")}
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        border: "1px solid var(--border)",
        borderRadius: "var(--r)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        sx={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: "12px",
          px: "16px",
          py: "14px",
          borderBottom: "1px solid var(--border)",
          background: "var(--s2)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "7px",
            background: "var(--s1)",
            border: "1px solid var(--border)",
            borderRadius: "7px",
            px: "9px",
            height: "28px",
            width: "calc(30% + 10px)",
            transition: "border-color 0.15s",
            "&:focus-within": {
              borderColor: "var(--accent-border)",
              boxShadow: "0 0 0 3px var(--accent-subtle)",
            },
          }}
        >
          <SearchOutlined
            sx={{ color: "var(--muted)", fontSize: "13px", flexShrink: 0 }}
          />
          <Box
            component="input"
            placeholder={t("tech_health.search_placeholder")}
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onSearchChange(e.target.value)
            }
            sx={{
              all: "unset",
              flex: 1,
              fontSize: "12px",
              color: "var(--text)",
              "&::placeholder": { color: "var(--muted)" },
              "&:focus": { outline: "none", boxShadow: "none !important" },
            }}
          />
        </Box>
        {search && (
          <Box
            component="span"
            sx={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              color: "var(--muted)",
            }}
          >
            {filteredDeps.length} / {dependencies.length}
          </Box>
        )}
      </Box>

      <Box sx={{ flexShrink: 0 }}>
        <Box
          component="table"
          sx={{
            width: "100%",
            borderCollapse: "collapse",
            tableLayout: "fixed",
          }}
        >
          <Box component="colgroup">
            <Box component="col" sx={{ width: "30%" }} />
            <Box component="col" sx={{ width: "9%" }} />
            <Box component="col" sx={{ width: "6%" }} />
            <Box component="col" sx={{ width: "17%" }} />
            <Box component="col" sx={{ width: "10%" }} />
            <Box component="col" sx={{ width: "12%" }} />
          </Box>
          <Box component="thead">
            <Box component="tr">
              <TH>{t("tech_health.table.dep.library")}</TH>
              <TH>{t("tech_health.table.dep.ecosystem")}</TH>
              <TH>{t("tech_health.table.dep.type")}</TH>
              <TH>{t("tech_health.table.dep.version")}</TH>
              <TH>{t("tech_health.table.dep.status")}</TH>
              <TH>{t("tech_health.table.dep.vulns")}</TH>
            </Box>
          </Box>
        </Box>
      </Box>
      <Box sx={{ overflowY: "auto", flex: 1 }}>
        <Box
          component="table"
          sx={{
            width: "100%",
            borderCollapse: "collapse",
            tableLayout: "fixed",
          }}
        >
          <Box component="colgroup">
            <Box component="col" sx={{ width: "30%" }} />
            <Box component="col" sx={{ width: "9%" }} />
            <Box component="col" sx={{ width: "6%" }} />
            <Box component="col" sx={{ width: "17%" }} />
            <Box component="col" sx={{ width: "10%" }} />
            <Box component="col" sx={{ width: "12%" }} />
          </Box>
          <Box component="tbody">
            {filteredDeps.length === 0 ? (
              <Box component="tr">
                <Box
                  component="td"
                  colSpan={6}
                  sx={{
                    padding: "32px",
                    textAlign: "center",
                    color: "var(--muted)",
                    fontSize: "13px",
                    borderBottom: "none",
                  }}
                >
                  {t("tech_health.no_results")}
                </Box>
              </Box>
            ) : (
              filteredDeps.map((d) => {
                const s = DEP_STATUS[d.status] ?? {
                  labelKey: "",
                  variant: "gray" as const,
                };
                return (
                  <TR key={d.id}>
                    <TD>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <InventoryOutlined
                          sx={{
                            fontSize: 13,
                            color: "var(--muted)",
                            flexShrink: 0,
                          }}
                        />
                        <Box
                          component="span"
                          sx={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "13px",
                            fontWeight: 600,
                          }}
                        >
                          {d.name}
                        </Box>
                      </Box>
                    </TD>
                    <TD>
                      <Box
                        component="span"
                        sx={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "10px",
                          color: "var(--muted)",
                          background: "var(--s3)",
                          px: "7px",
                          py: "2px",
                          borderRadius: "3px",
                        }}
                      >
                        {d.ecosystem}
                      </Box>
                    </TD>
                    <TD>
                      <StatusChip variant="gray">
                        {d.type === "Prod"
                          ? t("tech_health.dep.type_prod")
                          : t("tech_health.dep.type_dev")}
                      </StatusChip>
                    </TD>
                    <TD mono muted>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <span>{d.currentVersion}</span>
                        {d.latestVersion &&
                          d.latestVersion !== d.currentVersion && (
                            <>
                              <Box
                                component="span"
                                sx={{
                                  color: "var(--muted)",
                                  fontFamily: "var(--font-mono)",
                                }}
                              >
                                →
                              </Box>
                              <Box
                                component="span"
                                sx={{
                                  color: "var(--orange)",
                                  fontWeight: 600,
                                  fontFamily: "var(--font-mono)",
                                }}
                              >
                                {d.latestVersion}
                              </Box>
                            </>
                          )}
                      </Box>
                    </TD>
                    <TD>
                      <StatusChip variant={s.variant}>
                        {s.labelKey ? t(s.labelKey) : d.status}
                      </StatusChip>
                    </TD>
                    <TD>
                      {d.vulnerabilities.length > 0 ? (
                        <StatusChip variant="red">
                          {d.vulnerabilities.length}
                        </StatusChip>
                      ) : (
                        <Box
                          component="span"
                          sx={{ color: "var(--muted)", fontSize: "12px" }}
                        >
                          —
                        </Box>
                      )}
                    </TD>
                  </TR>
                );
              })
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
