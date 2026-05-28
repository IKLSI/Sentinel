import React, { useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { draggable, dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import {
  attachClosestEdge,
  extractClosestEdge,
  type Edge,
} from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import { KanbanTicket } from "../../helpers";
import { TicketCard } from "../TicketCard";

export interface DragData {
  type: "ticket";
  ticketId: string;
  sourceColId: string;
  sourceIndex: number;
}

interface Props {
  ticket: KanbanTicket;
  index: number;
  colId: string;
  updatingId: string | null;
  onCardClick: (id: string) => void;
}

const DropIndicator: React.FC<{ edge: "top" | "bottom" }> = ({ edge }) => (
  <Box
    sx={{
      position: "absolute",
      [edge]: -5,
      left: 0,
      right: 0,
      height: "2px",
      background: "var(--accent)",
      borderRadius: "2px",
      zIndex: 10,
      "@keyframes dropIndicatorIn": {
        from: { transform: "scaleX(0.4)", opacity: 0 },
        to: { transform: "scaleX(1)", opacity: 1 },
      },
      animation: "dropIndicatorIn 0.12s cubic-bezier(0.34,1.4,0.64,1) forwards",
      "&::before": {
        content: '""',
        position: "absolute",
        width: "7px",
        height: "7px",
        borderRadius: "50%",
        background: "var(--accent)",
        top: "50%",
        left: "-3px",
        transform: "translateY(-50%)",
      },
      "&::after": {
        content: '""',
        position: "absolute",
        width: "7px",
        height: "7px",
        borderRadius: "50%",
        background: "var(--accent)",
        top: "50%",
        right: "-3px",
        transform: "translateY(-50%)",
      },
    }}
  />
);

export const DraggableCard: React.FC<Props> = ({ ticket, index, colId, updatingId, onCardClick }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [closestEdge, setClosestEdge] = useState<Edge | null>(null);

  const indexRef = useRef(index);
  useEffect(() => { indexRef.current = index; }, [index]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    return combine(
      draggable({
        element: el,
        getInitialData: () => ({
          type: "ticket",
          ticketId: ticket.id,
          sourceColId: colId,
          sourceIndex: indexRef.current,
        } satisfies DragData),
        onDragStart: () => setIsDragging(true),
        onDrop: () => setIsDragging(false),
      }),
      dropTargetForElements({
        element: el,
        canDrop: ({ source }) => (source.data as unknown as DragData).ticketId !== ticket.id,
        getData: ({ input }) =>
          attachClosestEdge(
            { type: "ticket", ticketId: ticket.id, colId, index: indexRef.current },
            { element: el, input, allowedEdges: ["top", "bottom"] },
          ),
        onDrag: ({ self }) => setClosestEdge(extractClosestEdge(self.data)),
        onDragLeave: () => setClosestEdge(null),
        onDrop: () => setClosestEdge(null),
      }),
    );
  }, [ticket.id, colId]);

  return (
    <Box
      ref={ref}
      sx={{
        position: "relative",
        opacity: isDragging ? 0.4 : 1,
        filter: isDragging ? "grayscale(0.5)" : "none",
        transition: "opacity 0.12s ease, filter 0.12s ease",
      }}
    >
      {closestEdge === "top" && <DropIndicator edge="top" />}
      <TicketCard
        ticket={ticket}
        isDragging={isDragging}
        updatingId={updatingId}
        onCardClick={onCardClick}
      />
      {closestEdge === "bottom" && <DropIndicator edge="bottom" />}
    </Box>
  );
};
