import React, { useCallback, useEffect, useRef } from "react";
import Box from "@mui/material/Box";
import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { extractClosestEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import { KanbanColumns, KanbanColumnDef, KanbanDropResult } from "../../helpers";
import { SkeletonCard } from "../SkeletonCard";
import { KanbanColumnHeader } from "../KanbanColumnHeader";
import { DroppableColumn } from "./DroppableColumn";
import type { DragData } from "./DraggableCard";

interface Props {
  loading: boolean;
  filteredColumns: KanbanColumns;
  columnDefs: KanbanColumnDef[];
  updatingId: string | null;
  wasDraggingRef: React.MutableRefObject<boolean>;
  onDrop: (result: KanbanDropResult) => void;
  onCardClick: (ticketId: string) => void;
  onDeleteColumn: (id: string) => void;
  onAddColumn: () => void;
  collapsedColumns: Set<string>;
  onToggleCollapse: (id: string) => void;
}

export const KanbanBoard: React.FC<Props> = React.memo(function KanbanBoard({
  loading,
  filteredColumns,
  columnDefs,
  updatingId,
  wasDraggingRef,
  onDrop,
  onCardClick,
  onDeleteColumn,
  onAddColumn,
  collapsedColumns,
  onToggleCollapse,
}) {
  const filteredColumnsRef = useRef(filteredColumns);
  useEffect(() => { filteredColumnsRef.current = filteredColumns; }, [filteredColumns]);

  const safeCardClick = useCallback(
    (id: string) => {
      if (!wasDraggingRef.current) onCardClick(id);
    },
    [onCardClick, wasDraggingRef],
  );

  useEffect(() => {
    return monitorForElements({
      onDragStart: () => {
        wasDraggingRef.current = true;
      },
      onDrop: ({ source, location }) => {
        setTimeout(() => { wasDraggingRef.current = false; }, 0);

        const dragData = source.data as unknown as DragData;
        if (dragData.type !== "ticket") return;

        const targets = location.current.dropTargets;
        if (!targets.length) return;

        const cardTarget = targets.find((t) => (t.data as { type: string }).type === "ticket");
        const colTarget = targets.find((t) => (t.data as { type: string }).type === "column");

        let destColId: string;
        let destIndex: number;

        if (cardTarget) {
          destColId = cardTarget.data.colId as string;
          const edge = extractClosestEdge(cardTarget.data);
          const targetIdx = cardTarget.data.index as number;
          destIndex = edge === "bottom" ? targetIdx + 1 : targetIdx;
        } else if (colTarget) {
          destColId = colTarget.data.colId as string;
          destIndex = (filteredColumnsRef.current[destColId] ?? []).length;
        } else {
          return;
        }

        onDrop({
          ticketId: dragData.ticketId,
          sourceColId: dragData.sourceColId,
          sourceIndex: dragData.sourceIndex,
          destColId,
          destIndex,
        });
      },
    });
  }, [onDrop, wasDraggingRef]);

  if (loading) {
    return (
      <Box sx={{ flex: 1, overflowX: "auto", overflowY: "hidden", px: "28px", pb: "20px", minHeight: 0 }}>
        <div style={{ display: "flex", gap: "12px", minWidth: "fit-content", height: "100%" }}>
          {columnDefs.map((colDef) => (
            <div key={colDef.id} style={{ width: "280px", height: "100%", display: "flex", flexDirection: "column" }}>
              <KanbanColumnHeader colDef={colDef} loading />
              <Box
                sx={{
                  flex: 1, minHeight: 0, display: "flex", flexDirection: "column",
                  gap: "6px", padding: "8px 0 16px", background: "var(--s1)",
                  border: "1px solid var(--border)", borderRadius: "var(--r)", px: "8px", overflowY: "hidden",
                }}
              >
                {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
              </Box>
            </div>
          ))}
        </div>
      </Box>
    );
  }

  return (
    <Box sx={{ flex: 1, overflowX: "auto", overflowY: "hidden", px: "28px", pb: "20px", minHeight: 0 }}>
      <div style={{ display: "flex", gap: "12px", minWidth: "fit-content", height: "100%" }}>
        {columnDefs.map((colDef) => {
          const isCollapsed = collapsedColumns.has(colDef.id);
          return (
            <DroppableColumn
              key={colDef.id}
              colDef={colDef}
              colTickets={filteredColumns[colDef.id] ?? []}
              updatingId={updatingId}
              onCardClick={safeCardClick}
              onDeleteColumn={onDeleteColumn}
              isCollapsed={isCollapsed}
              onToggleCollapse={() => onToggleCollapse(colDef.id)}
            />
          );
        })}

        <Box
          onClick={onAddColumn}
          sx={{
            width: "280px", height: "100%", flexShrink: 0, display: "flex", flexDirection: "column",
            border: "2px dashed var(--border2)", borderRadius: "var(--r)", cursor: "pointer",
            color: "var(--muted2)", transition: "border-color 0.2s, color 0.2s, background 0.2s",
            "&:hover": {
              borderColor: "var(--accent)", color: "var(--accent)",
              background: "color-mix(in srgb, var(--accent) 5%, transparent)",
              "& .add-col-icon-wrap": { transform: "rotate(90deg)" },
            },
          }}
        >
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px" }}>
            <Box className="add-col-icon-wrap" sx={{ display: "flex", alignItems: "center", justifyContent: "center", transition: "transform 0.45s cubic-bezier(0.34,1.56,0.64,1)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </Box>
            <Box className="add-col-label" sx={{ fontSize: "12px", fontWeight: 600, letterSpacing: "0.03em" }}>
              Ajouter une colonne
            </Box>
          </Box>
        </Box>
      </div>
    </Box>
  );
});
