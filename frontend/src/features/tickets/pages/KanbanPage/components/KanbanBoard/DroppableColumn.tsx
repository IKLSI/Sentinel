import React, { useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { KanbanColumnDef, KanbanTicket } from "../../helpers";
import { KanbanColumnHeader } from "../KanbanColumnHeader";
import { DraggableCard } from "./DraggableCard";

interface Props {
  colDef: KanbanColumnDef;
  colTickets: KanbanTicket[];
  updatingId: string | null;
  onCardClick: (id: string) => void;
  onDeleteColumn: (id: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const DroppableColumn: React.FC<Props> = React.memo(function DroppableColumn({
  colDef,
  colTickets,
  updatingId,
  onCardClick,
  onDeleteColumn,
  isCollapsed,
  onToggleCollapse,
}) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  useEffect(() => {
    const el = bodyRef.current;
    if (!el || isCollapsed) return;

    return dropTargetForElements({
      element: el,
      getData: () => ({ type: "column", colId: colDef.id }),
      onDragEnter: () => setIsDraggingOver(true),
      onDragLeave: () => setIsDraggingOver(false),
      onDrop: () => setIsDraggingOver(false),
    });
  }, [colDef.id, isCollapsed]);

  return (
    <div
      style={{
        width: isCollapsed ? "44px" : "280px",
        minWidth: isCollapsed ? "44px" : "280px",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        transition: "width 0.2s ease, min-width 0.2s ease",
      }}
    >
      <KanbanColumnHeader
        colDef={colDef}
        count={colTickets.length}
        onDelete={onDeleteColumn}
        isCollapsed={isCollapsed}
        onToggleCollapse={onToggleCollapse}
      />

      {!isCollapsed && (
        <div
          ref={bodyRef}
          className="kanban-col-body"
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            padding: "8px 8px 16px 8px",
            background: isDraggingOver ? colDef.subtle : "var(--s1)",
            border: `1px solid ${isDraggingOver ? colDef.border : "var(--border)"}`,
            borderRadius: "0 0 var(--r) var(--r)",
            borderTop: "none",
            transition: "background 0.15s, border-color 0.15s",
          }}
        >
          {colTickets.map((ticket, idx) => (
            <DraggableCard
              key={ticket.id}
              ticket={ticket}
              index={idx}
              colId={colDef.id}
              updatingId={updatingId}
              onCardClick={onCardClick}
            />
          ))}

          {colTickets.length === 0 && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flex: 1,
                mx: "4px",
                my: "4px",
                borderRadius: "var(--r-xs)",
                border: isDraggingOver
                  ? `2px dashed ${colDef.border}`
                  : "2px dashed transparent",
                transition: "border-color 0.15s, background 0.15s",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "8px",
                  opacity: isDraggingOver ? 0.6 : 0.18,
                  transition: "opacity 0.15s",
                }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 9.5h18v9A2 2 0 0 1 19 20.5H5A2 2 0 0 1 3 18.5V9.5z" stroke="var(--muted2)" strokeWidth="1.5" strokeLinejoin="round" />
                  <path d="M3 9.5l2.5-6h13l2.5 6" stroke="var(--muted2)" strokeWidth="1.5" strokeLinejoin="round" />
                  <path d="M12 3.5v6" stroke="var(--muted2)" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M8 9.5c0 2.2 1.8 4 4 4s4-1.8 4-4" stroke="var(--muted2)" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </Box>
            </Box>
          )}
        </div>
      )}
    </div>
  );
});
