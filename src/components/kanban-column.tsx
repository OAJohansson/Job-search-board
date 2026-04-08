"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Badge } from "@/components/ui/badge";
import { JobCard } from "@/components/job-card";
import type { Job, JobStatus } from "@/lib/types";

interface KanbanColumnProps {
  status: JobStatus;
  jobs: Job[];
  onDeleteJob: (jobId: string, column: string) => void;
}

const STATUS_COLORS: Record<JobStatus, string> = {
  Saved: "bg-gray-100 text-gray-700",
  Applied: "bg-blue-100 text-blue-700",
  Interviewing: "bg-yellow-100 text-yellow-700",
  Offer: "bg-green-100 text-green-700",
  Rejected: "bg-red-100 text-red-700",
};

export function KanbanColumn({ status, jobs, onDeleteJob }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${status}`,
    data: { column: status },
  });

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-lg bg-muted/50">
      <div className="flex items-center justify-between p-3 pb-2">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold">{status}</h2>
          <Badge variant="secondary" className={STATUS_COLORS[status]}>
            {jobs.length}
          </Badge>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-3 pb-3">
        <SortableContext
          items={jobs.map((j) => j.id)}
          strategy={verticalListSortingStrategy}
        >
          <div
            ref={setNodeRef}
            className={`flex min-h-[100px] flex-col gap-2 rounded-md p-1 transition-colors ${
              isOver ? "bg-accent/50" : ""
            }`}
          >
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                column={status}
                onDelete={onDeleteJob}
              />
            ))}
            {jobs.length === 0 && (
              <p className="py-8 text-center text-xs text-muted-foreground">
                No jobs here yet
              </p>
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}
