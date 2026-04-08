"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { KanbanColumn } from "@/components/kanban-column";
import { updateJobStatus, reorderJob } from "@/lib/actions";
import { toast } from "sonner";
import {
  JOB_STATUSES,
  type BoardData,
  type JobStatus,
} from "@/lib/types";

interface KanbanBoardProps {
  initialData: BoardData;
}

export function KanbanBoard({ initialData }: KanbanBoardProps) {
  const [board, setBoard] = useState<BoardData>(initialData);
  const [, startTransition] = useTransition();
  const pendingOps = useRef(0);
  // boardRef always holds the latest board so event handlers don't close over stale state
  const boardRef = useRef(board);
  boardRef.current = board;
  // Original source column captured at drag start
  const dragSource = useRef<{ jobId: string; column: JobStatus } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  useEffect(() => {
    if (pendingOps.current === 0) {
      setBoard(initialData);
    }
  }, [initialData]);

  function findColumn(id: string, b: BoardData): JobStatus | null {
    if (id.startsWith("column-")) {
      const col = id.replace("column-", "") as JobStatus;
      return JOB_STATUSES.includes(col) ? col : null;
    }
    for (const status of JOB_STATUSES) {
      if (b[status].some((j) => j.id === id)) return status;
    }
    return null;
  }

  function handleDeleteJob(jobId: string, column: string) {
    setBoard((prev) => ({
      ...prev,
      [column]: prev[column as JobStatus].filter((j) => j.id !== jobId),
    }));
  }

  function handleDragStart(event: DragStartEvent) {
    const col = event.active.data.current?.column as JobStatus | undefined;
    if (col) dragSource.current = { jobId: String(event.active.id), column: col };
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    setBoard((prev) => {
      const sourceCol = findColumn(activeId, prev);
      const targetCol = findColumn(overId, prev);
      if (!sourceCol || !targetCol || sourceCol === targetCol) return prev;

      const job = prev[sourceCol].find((j) => j.id === activeId);
      if (!job) return prev;

      const sourceJobs = prev[sourceCol].filter((j) => j.id !== activeId);
      const targetJobs = [...prev[targetCol]];

      let insertIndex = targetJobs.length;
      if (!overId.startsWith("column-")) {
        const overIdx = targetJobs.findIndex((j) => j.id === overId);
        if (overIdx !== -1) insertIndex = overIdx;
      }

      targetJobs.splice(insertIndex, 0, { ...job, status: targetCol });
      return { ...prev, [sourceCol]: sourceJobs, [targetCol]: targetJobs };
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    const src = dragSource.current;
    dragSource.current = null;

    if (!over || !src) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    // Read latest board state from ref (not from closure — dragOver may have updated it)
    const currentBoard = boardRef.current;
    const currentCol = findColumn(activeId, currentBoard);
    if (!currentCol) return;

    if (src.column !== currentCol) {
      // Card moved to a different column — persist to server
      const newPosition = currentBoard[currentCol].findIndex((j) => j.id === activeId);
      pendingOps.current++;
      startTransition(async () => {
        try {
          await updateJobStatus(activeId, currentCol, newPosition);
        } catch (err) {
          toast.error(`Failed to save: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
          pendingOps.current--;
        }
      });
    } else {
      // Same column — check for reorder
      if (activeId === overId || overId.startsWith("column-")) return;

      const columnJobs = currentBoard[currentCol];
      const oldIndex = columnJobs.findIndex((j) => j.id === activeId);
      const newIndex = columnJobs.findIndex((j) => j.id === overId);
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

      const reordered = arrayMove(columnJobs, oldIndex, newIndex);
      setBoard((prev) => ({ ...prev, [currentCol]: reordered }));

      pendingOps.current++;
      startTransition(async () => {
        try {
          await reorderJob(activeId, newIndex);
        } catch (err) {
          toast.error(`Failed to save: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
          pendingOps.current--;
        }
      });
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {JOB_STATUSES.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            jobs={board[status]}
            onDeleteJob={handleDeleteJob}
          />
        ))}
      </div>
    </DndContext>
  );
}
