"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { updateJob } from "@/lib/actions";
import type { Job } from "@/lib/types";

interface EditJobDialogProps {
  job: Job | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditJobDialog({ job, open, onOpenChange }: EditJobDialogProps) {
  const [isPending, startTransition] = useTransition();

  if (!job) return null;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!job) return;

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        await updateJob(job.id, formData);
        toast.success("Job updated successfully");
        onOpenChange(false);
      } catch {
        toast.error("Failed to update job");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Job</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Title *</Label>
            <Input
              id="edit-title"
              name="title"
              defaultValue={job.title}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-company">Company *</Label>
            <Input
              id="edit-company"
              name="company"
              defaultValue={job.company}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-location">Location</Label>
            <Input
              id="edit-location"
              name="location"
              defaultValue={job.location}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-industry">Industry</Label>
            <Input
              id="edit-industry"
              name="industry"
              defaultValue={job.industry}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-url">Job URL</Label>
            <Input
              id="edit-url"
              name="url"
              type="url"
              defaultValue={job.url}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-salaryMin">Salary Min</Label>
              <Input
                id="edit-salaryMin"
                name="salaryMin"
                type="number"
                defaultValue={job.salaryMin ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-salaryMax">Salary Max</Label>
              <Input
                id="edit-salaryMax"
                name="salaryMax"
                type="number"
                defaultValue={job.salaryMax ?? ""}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-notes">Notes</Label>
            <Textarea
              id="edit-notes"
              name="notes"
              defaultValue={job.notes}
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
