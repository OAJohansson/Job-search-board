"use client";

import { useRef, useState, useTransition } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { importJobs } from "@/lib/actions";

interface ImportCSVDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split("\n").filter((line) => line.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim());
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim());
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || "";
    });
    rows.push(row);
  }

  return rows;
}

function mapCSVRow(row: Record<string, string>) {
  // Map known CSV column names to our job fields
  const title =
    row["Position"] || row["Title"] || row["Job Title"] || row["Role"] || "";
  const company =
    row["Company name"] || row["Company"] || row["Employer"] || "";
  const notes = [row["Industry"] || "", row["Notes"] || ""]
    .filter(Boolean)
    .join(" — ");
  const url = row["Application link"] || row["Link"] || row["URL"] || "";
  const status = row["Outcome"] || row["Status"] || "";
  const dateApplied =
    row["Application date"] || row["Date Applied"] || row["Date"] || null;

  return { title, company, notes, url, status, dateApplied };
}

export function ImportCSVDialog({ open, onOpenChange }: ImportCSVDialogProps) {
  const [preview, setPreview] = useState<ReturnType<typeof mapCSVRow>[]>([]);
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const rows = parseCSV(text);
      const mapped = rows.map(mapCSVRow).filter((r) => r.title && r.company);
      setPreview(mapped);
    };
    reader.readAsText(file);
  }

  function handleImport() {
    startTransition(async () => {
      try {
        const result = await importJobs(preview);
        toast.success(`Imported ${result.imported} jobs`);
        setPreview([]);
        onOpenChange(false);
      } catch {
        toast.error("Failed to import jobs");
      }
    });
  }

  function handleClose(isOpen: boolean) {
    if (!isOpen) {
      setPreview([]);
      if (fileRef.current) fileRef.current.value = "";
    }
    onOpenChange(isOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file with columns: Company name, Position, Application
            date, Outcome, Application link, Notes
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => fileRef.current?.click()}
              className="w-full"
            >
              <Upload className="mr-2 h-4 w-4" />
              Choose CSV File
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {preview.length > 0 && (
            <>
              <div className="max-h-60 overflow-auto rounded-md border">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-muted">
                    <tr>
                      <th className="p-2 text-left font-medium">Title</th>
                      <th className="p-2 text-left font-medium">Company</th>
                      <th className="p-2 text-left font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i} className="border-t">
                        <td className="p-2">{row.title}</td>
                        <td className="p-2">{row.company}</td>
                        <td className="p-2">{row.status || "Saved"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {preview.length} jobs found
                </p>
                <Button onClick={handleImport} disabled={isPending}>
                  {isPending
                    ? "Importing..."
                    : `Import ${preview.length} Jobs`}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
