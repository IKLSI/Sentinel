import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import GlobalStyles from "@mui/material/GlobalStyles";
import { DropResult } from "@hello-pangea/dnd";
import { useToast } from "@/hooks/useToast";
import { useT } from "@/i18n/I18nContext";
import { changeStatus, getTickets } from "@/features/tickets/api/tickets";
import { getProjects } from "@/features/techHealth/api/projects";
import { TicketStatus } from "@/types";
import {
  KanbanColumns,
  KanbanTicket,
  ProjectInfo,
  arrayMove,
  columnOrder,
  emptyColumns,
  ticketsToColumns,
} from "./helpers";
import { KanbanToolbar } from "./components/KanbanToolbar";
import { ProjectPicker } from "./components/ProjectPicker";
import { KanbanBoard } from "./components/KanbanBoard";

export const KanbanPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const t = useT();
  const [columns, setColumns] = useState<KanbanColumns>(emptyColumns());
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [filteredProjects, setFilteredProjects] = useState<string[]>([]);
  const wasDragging = useRef(false);

  const [allProjectNames, setAllProjectNames] = useState<string[]>([]);

  useEffect(() => {
    getProjects()
      .then((projects) =>
        setAllProjectNames([...new Set(projects.map((p) => p.name))].sort()),
      )
      .catch(() => {});
  }, []);

  const allProjects = useMemo<ProjectInfo[]>(() => {
    const counts: Record<string, number> = {};
    for (const colId of columnOrder) {
      for (const ticket of columns[colId]) {
        counts[ticket.project] = (counts[ticket.project] ?? 0) + 1;
      }
    }
    return allProjectNames.map((name) => ({
      name,
      ticketCount: counts[name] ?? 0,
    }));
  }, [allProjectNames, columns]);

  const activeFilterCount = filteredProjects.length;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getTickets({ pageSize: 200 });
      setColumns(ticketsToColumns(result.items));
    } catch {
      showToast(t("tickets.kanban.error.load_failed"), "error");
    } finally {
      setLoading(false);
    }
  }, [showToast, t]);

  useEffect(() => {
    load();
  }, [load]);

  const filteredColumns = useMemo<KanbanColumns>(() => {
    const term = search.toLowerCase().trim();
    const filter = (tickets: KanbanTicket[]) => {
      let result = tickets;
      if (term)
        result = result.filter(
          (tk) =>
            tk.title.toLowerCase().includes(term) ||
            tk.reference.toLowerCase().includes(term),
        );
      if (filteredProjects.length)
        result = result.filter((tk) => filteredProjects.includes(tk.project));
      return result;
    };
    return {
      new: filter(columns.new),
      in_progress: filter(columns.in_progress),
      testing: filter(columns.testing),
      resolved: filter(columns.resolved),
      closed: filter(columns.closed),
    };
  }, [columns, search, filteredProjects]);

  const onDragEnd = useCallback(
    async (result: DropResult) => {
      setTimeout(() => {
        wasDragging.current = false;
      }, 0);

      if (!result.destination) return;
      const { draggableId, source, destination } = result;
      const sourceCol = source.droppableId as TicketStatus;
      const destCol = destination.droppableId as TicketStatus;
      if (sourceCol === destCol && source.index === destination.index) return;

      if (sourceCol === destCol) {
        const visibleItems = filteredColumns[sourceCol];
        const movedId = visibleItems[source.index]?.id;
        const targetId = visibleItems[destination.index]?.id;
        if (!movedId || !targetId) return;
        setColumns((prev) => {
          const items = [...prev[sourceCol]];
          return {
            ...prev,
            [sourceCol]: arrayMove(
              items,
              items.findIndex((tk) => tk.id === movedId),
              items.findIndex((tk) => tk.id === targetId),
            ),
          };
        });
        return;
      }

      const movedTicket = columns[sourceCol].find(
        (tk) => tk.id === draggableId,
      );
      if (!movedTicket) return;

      const afterId = filteredColumns[destCol][destination.index]?.id;
      setColumns((prev) => {
        const sourceItems = prev[sourceCol].filter(
          (tk) => tk.id !== draggableId,
        );
        const destItems = [...prev[destCol]];
        const insertAt = afterId
          ? destItems.findIndex((tk) => tk.id === afterId)
          : destItems.length;
        destItems.splice(
          insertAt >= 0 ? insertAt : destItems.length,
          0,
          movedTicket,
        );
        return { ...prev, [sourceCol]: sourceItems, [destCol]: destItems };
      });

      setUpdatingId(draggableId);
      try {
        await changeStatus(draggableId, destCol);
      } catch {
        showToast(t("tickets.kanban.error.status_change_failed"), "error");
        load();
      } finally {
        setUpdatingId(null);
      }
    },
    [columns, filteredColumns, showToast, load, t],
  );

  return (
    <>
      <GlobalStyles
        styles={{
          ".kanban-col-body": {
            scrollbarWidth: "thin",
            scrollbarColor: "var(--border2) transparent",
          },
          ".kanban-col-body::-webkit-scrollbar": { width: "3px" },
          ".kanban-col-body::-webkit-scrollbar-track": {
            background: "transparent",
          },
          ".kanban-col-body::-webkit-scrollbar-thumb": {
            background: "var(--border2)",
            borderRadius: "4px",
          },
        }}
      />

      <Box
        className="kanban-content"
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          overflow: "hidden",
        }}
      >
        <KanbanToolbar
          search={search}
          onSearchChange={setSearch}
          activeFilterCount={activeFilterCount}
          onOpenFilters={() => setFilterOpen(true)}
        />

        <ProjectPicker
          open={filterOpen}
          onClose={() => setFilterOpen(false)}
          allProjects={allProjects}
          selected={filteredProjects}
          onApply={setFilteredProjects}
        />

        <KanbanBoard
          loading={loading}
          filteredColumns={filteredColumns}
          updatingId={updatingId}
          wasDraggingRef={wasDragging}
          onDragEnd={onDragEnd}
          onCardClick={(id) => navigate(`/tickets/${id}`)}
        />
      </Box>
    </>
  );
};
