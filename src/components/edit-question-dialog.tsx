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
import { updateQuestion } from "@/lib/question-actions";

interface Category {
  id: string;
  name: string;
}

interface Question {
  id: string;
  text: string;
  answer: string;
  confidence: number;
  categoryId: string;
}

interface EditQuestionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  question: Question | null;
  categories: Category[];
}

export function EditQuestionDialog({
  open,
  onOpenChange,
  question,
  categories,
}: EditQuestionDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [confidence, setConfidence] = useState(question?.confidence ?? 1);
  const [categoryId, setCategoryId] = useState(question?.categoryId ?? "");

  // Sync state when question changes
  if (question && confidence !== question.confidence && !open) {
    setConfidence(question.confidence);
  }
  if (question && categoryId !== question.categoryId && !open) {
    setCategoryId(question.categoryId);
  }

  if (!question) return null;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!question) return;

    const formData = new FormData(e.currentTarget);
    formData.set("confidence", String(confidence));
    formData.set("categoryId", categoryId);

    startTransition(async () => {
      try {
        await updateQuestion(question.id, formData);
        toast.success("Question updated");
        onOpenChange(false);
      } catch {
        toast.error("Failed to update question");
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (isOpen && question) {
          setConfidence(question.confidence);
          setCategoryId(question.categoryId);
        }
        onOpenChange(isOpen);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Question</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="eq-text">Question *</Label>
            <Input
              id="eq-text"
              name="text"
              defaultValue={question.text}
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
            <Label htmlFor="eq-answer">STAR Method Answer</Label>
            <Textarea
              id="eq-answer"
              name="answer"
              defaultValue={question.answer}
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
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !categoryId}>
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
