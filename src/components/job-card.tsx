"use client";

import { useState, useTransition } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ExternalLink, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { EditJobDialog } from "@/components/edit-job-dialog";
import { deleteJob } from "@/lib/actions";
import { toast } from "sonner";
import type { Job } from "@/lib/types";

interface JobCardProps {
  job: Job;
  column: string;
  onDelete: (jobId: string, column: string) => void;
}

function getDaysAgo(date: Date | null): string {
  if (!date) return "";
  const now = new Date();
  const diff = Math.floor(
    (now.getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diff === 0) return "Today";
  if (diff === 1) return "1 day ago";
  return `${diff} days ago`;
}

export function JobCard({ job, column, onDelete }: JobCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: job.id,
    data: { job, column },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  function handleDelete() {
    onDelete(job.id, column);
    startTransition(async () => {
      try {
        await deleteJob(job.id);
        toast.success("Job deleted");
      } catch {
        toast.error("Failed to delete job");
      }
    });
  }

  return (
    <>
      <Card
        ref={setNodeRef}
        style={style}
        suppressHydrationWarning
        className={`cursor-grab active:cursor-grabbing transition-opacity ${
          isDragging ? "opacity-40" : ""
        } ${isPending ? "opacity-70" : ""}`}
        {...attributes}
        {...listeners}
      >
        <CardHeader className="p-3 pb-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-tight truncate">
                {job.company}
              </p>
              <h3 className="text-xs text-muted-foreground mt-0.5 line-clamp-2 break-words">
                {job.title}
              </h3>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEditOpen(true)}>
                  <Pencil className="mr-2 h-3.5 w-3.5" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setDeleteOpen(true)}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="p-3 pt-2">
          {job.location && (
            <p className="text-xs text-muted-foreground truncate">
              {job.location}
            </p>
          )}
          {job.industry && (
            <p className="text-xs text-muted-foreground truncate">
              {job.industry}
            </p>
          )}
          {job.notes && (
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2 break-words">
              {job.notes}
            </p>
          )}
          <div className="mt-2 flex items-center justify-between">
            {job.dateApplied && (
              <span className="text-xs text-muted-foreground">
                {getDaysAgo(job.dateApplied)}
              </span>
            )}
            {job.url && (
              <a
                href={job.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground"
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </CardContent>
      </Card>
      <EditJobDialog job={job} open={editOpen} onOpenChange={setEditOpen} />
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Job</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this job post?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Yes</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
