"use client";

import { useState, useTransition } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StarRating } from "@/components/star-rating";
import { createQuestion } from "@/lib/question-actions";

interface Category {
  id: string;
  name: string;
}

interface AddQuestionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
}

export function AddQuestionDialog({
  open,
  onOpenChange,
  categories,
}: AddQuestionDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [confidence, setConfidence] = useState(1);
  const [categoryId, setCategoryId] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("confidence", String(confidence));
    formData.set("categoryId", categoryId);

    startTransition(async () => {
      try {
        await createQuestion(formData);
        toast.success("Question added");
        setConfidence(1);
        setCategoryId("");
        onOpenChange(false);
      } catch {
        toast.error("Failed to add question");
      }
    });
  }

  function handleClose(isOpen: boolean) {
    if (!isOpen) {
      setConfidence(1);
      setCategoryId("");
    }
    onOpenChange(isOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Question</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="q-text">Question *</Label>
            <Input
              id="q-text"
              name="text"
              placeholder="e.g. Tell me about a time you launched a product..."
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Category *</Label>
            <Select value={categoryId} onValueChange={setCategoryId} required>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="q-answer">STAR Method Answer</Label>
            <Textarea
              id="q-answer"
              name="answer"
              placeholder="Situation, Task, Action, Result..."
              rows={5}
            />
          </div>
          <div className="space-y-2">
            <Label>Confidence Level</Label>
            <StarRating value={confidence} onChange={setConfidence} />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !categoryId}>
              {isPending ? "Adding..." : "Add Question"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
