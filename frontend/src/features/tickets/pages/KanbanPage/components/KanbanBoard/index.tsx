import React, { useCallback } from "react";
import Box from "@mui/material/Box";
import {
  DragDropContext,
  Draggable,
  DropResult,
  Droppable,
} from "@hello-pangea/dnd";
import { KanbanColumns, KanbanColumnDef } from "../../helpers";
import { TicketCard } from "../TicketCard";
import { SkeletonCard } from "../SkeletonCard";
import { KanbanColumnHeader } from "../KanbanColumnHeader";

interface Props {
  loading: boolean;
  filteredColumns: KanbanColumns;
  columnDefs: KanbanColumnDef[];
  updatingId: string | null;
  wasDraggingRef: React.MutableRefObject<boolean>;
  onDragEnd: (result: DropResult) => void;
  onCardClick: (ticketId: string) => void;
  onDeleteColumn: (id: string) => void;
  onAddColumn: () => void;
}

export const KanbanBoard: React.FC<Props> = React.memo(function KanbanBoard({
  loading,
  filteredColumns,
  columnDefs,
  updatingId,
  wasDraggingRef,
  onDragEnd,
  onCardClick,
  onDeleteColumn,
  onAddColumn,
}) {
  const safeCardClick = useCallback(
    (id: string) => {
      if (!wasDraggingRef.current) onCardClick(id);
    },
    [onCardClick, wasDraggingRef],
  );

  if (loading) {
    return (
      <Box
        sx={{
          flex: 1,
          overflowX: "auto",
          overflowY: "hidden",
          px: "28px",
          pb: "20px",
          minHeight: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "12px",
            minWidth: "fit-content",
            height: "100%",
          }}
        >
          {columnDefs.map((colDef) => (
            <div
              key={colDef.id}
              style={{
                width: "280px",
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <KanbanColumnHeader colDef={colDef} loading />
              <Box
                sx={{
                  flex: 1,
                  minHeight: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  padding: "8px 0 16px",
                  background: "var(--s1)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--r)",
                  px: "8px",
                  overflowY: "hidden",
                }}
              >
                {[1, 2, 3].map((i) => (
                  <SkeletonCard key={i} />
                ))}
              </Box>
            </div>
          ))}
        </div>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        flex: 1,
        overflowX: "auto",
        overflowY: "hidden",
        px: "28px",
        pb: "20px",
        minHeight: 0,
      }}
    >
      <DragDropContext
        onBeforeDragStart={() => {
          wasDraggingRef.current = true;
        }}
        onDragEnd={onDragEnd}
      >
        <div
          style={{
            display: "flex",
            gap: "12px",
            minWidth: "fit-content",
            height: "100%",
          }}
        >
          {columnDefs.map((colDef) => {
            const colTickets = filteredColumns[colDef.id] ?? [];

            return (
              <div
                key={colDef.id}
                style={{
                  width: "280px",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <KanbanColumnHeader
                  colDef={colDef}
                  count={colTickets.length}
                  onDelete={onDeleteColumn}
                />

                <Droppable droppableId={colDef.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="kanban-col-body"
                      style={{
                        flex: 1,
                        minHeight: 0,
                        overflowY: "auto",
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                        padding: "8px 8px 16px 8px",
                        background: snapshot.isDraggingOver
                          ? colDef.subtle
                          : "var(--s1)",
                        border: `1px solid ${snapshot.isDraggingOver ? colDef.border : "var(--border)"}`,
                        borderRadius: "var(--r)",
                        transition: "background 0.15s, border-color 0.15s",
                      }}
                    >
                      {colTickets.map((ticket, index) => (
                        <Draggable
                          key={ticket.id}
                          draggableId={ticket.id}
                          index={index}
                        >
                          {(prov, snap) => (
                            <div
                              ref={prov.innerRef}
                              {...prov.draggableProps}
                              {...prov.dragHandleProps}
                              style={{ ...prov.draggableProps.style }}
                            >
                              <TicketCard
                                ticket={ticket}
                                isDragging={snap.isDragging}
                                updatingId={updatingId}
                                onCardClick={safeCardClick}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}

                      {colTickets.length === 0 && (
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flex: 1,
                            opacity: 0.2,
                          }}
                        >
                          <svg
                            width="28"
                            height="28"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M3 9.5h18v9A2 2 0 0 1 19 20.5H5A2 2 0 0 1 3 18.5V9.5z"
                              stroke="var(--muted2)"
                              strokeWidth="1.5"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M3 9.5l2.5-6h13l2.5 6"
                              stroke="var(--muted2)"
                              strokeWidth="1.5"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M12 3.5v6"
                              stroke="var(--muted2)"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                            />
                            <path
                              d="M8 9.5c0 2.2 1.8 4 4 4s4-1.8 4-4"
                              stroke="var(--muted2)"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                            />
                          </svg>
                        </Box>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}

          <Box
            onClick={onAddColumn}
            sx={{
              width: "280px",
              height: "100%",
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
              border: "2px dashed var(--border2)",
              borderRadius: "var(--r)",
              cursor: "pointer",
              color: "var(--muted2)",
              transition: "border-color 0.2s, color 0.2s, background 0.2s",
              "&:hover": {
                borderColor: "var(--accent)",
                color: "var(--accent)",
                background: "color-mix(in srgb, var(--accent) 5%, transparent)",
                "& .add-col-icon-wrap": {
                  transform: "rotate(90deg)",
                },
              },
            }}
          >
            <Box
              sx={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
              }}
            >
              <Box
                className="add-col-icon-wrap"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "transform 0.45s cubic-bezier(0.34,1.56,0.64,1)",
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 5v14M5 12h14"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </Box>
              <Box
                className="add-col-label"
                sx={{
                  fontSize: "12px",
                  fontWeight: 600,
                  letterSpacing: "0.03em",
                }}
              >
                Ajouter une colonne
              </Box>
            </Box>
          </Box>
        </div>
      </DragDropContext>
    </Box>
  );
});
