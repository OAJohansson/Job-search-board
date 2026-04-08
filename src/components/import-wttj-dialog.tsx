"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { createJob } from "@/lib/actions";

interface ImportWttjDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface JobData {
  title: string;
  company: string;
  location: string;
  industry: string;
  salaryMin: number | null;
  salaryMax: number | null;
  url: string;
  notes: string;
}

export function ImportWttjDialog({ open, onOpenChange }: ImportWttjDialogProps) {
  const [url, setUrl] = useState("");
  const [jobData, setJobData] = useState<JobData | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleFetch() {
    if (!url.trim()) return;

    setIsFetching(true);
    try {
      const response = await fetch("/api/welcometothejungle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to fetch job data");
        return;
      }

      setJobData(data);
    } catch {
      toast.error("Failed to fetch job data from Welcome to the Jungle");
    } finally {
      setIsFetching(false);
    }
  }

  function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        await createJob(formData);
        toast.success("Job added successfully");
        handleClose(false);
      } catch {
        toast.error("Failed to add job");
      }
    });
  }

  function handleClose(isOpen: boolean) {
    if (!isOpen) {
      setUrl("");
      setJobData(null);
      setIsFetching(false);
    }
    onOpenChange(isOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://www.welcometothejungle.com/favicon.ico"
              alt=""
              className="h-5 w-5"
            />
            Import from Welcome to the Jungle
          </DialogTitle>
          <DialogDescription>
            Paste a Welcome to the Jungle job URL to auto-fill the details.
            Review and edit before saving.
          </DialogDescription>
        </DialogHeader>

        {!jobData ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="wttj-url">Welcome to the Jungle Job URL</Label>
              <Input
                id="wttj-url"
                placeholder="https://www.welcometothejungle.com/en/companies/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleFetch();
                  }
                }}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleClose(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleFetch} disabled={isFetching || !url.trim()}>
                {isFetching ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Fetching...
                  </>
                ) : (
                  "Fetch Job Details"
                )}
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="wttj-title">Title *</Label>
              <Input
                id="wttj-title"
                name="title"
                defaultValue={jobData.title}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wttj-company">Company *</Label>
              <Input
                id="wttj-company"
                name="company"
                defaultValue={jobData.company}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wttj-location">Location</Label>
              <Input
                id="wttj-location"
                name="location"
                defaultValue={jobData.location}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wttj-industry">Industry</Label>
              <Input
                id="wttj-industry"
                name="industry"
                defaultValue={jobData.industry}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wttj-url-field">Job URL</Label>
              <Input
                id="wttj-url-field"
                name="url"
                type="url"
                defaultValue={jobData.url}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="wttj-salaryMin">Salary Min</Label>
                <Input
                  id="wttj-salaryMin"
                  name="salaryMin"
                  type="number"
                  defaultValue={jobData.salaryMin ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wttj-salaryMax">Salary Max</Label>
                <Input
                  id="wttj-salaryMax"
                  name="salaryMax"
                  type="number"
                  defaultValue={jobData.salaryMax ?? ""}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="wttj-notes">Notes</Label>
              <Textarea
                id="wttj-notes"
                name="notes"
                defaultValue={jobData.notes}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setJobData(null)}
              >
                Back
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : "Save Job"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
