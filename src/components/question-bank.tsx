"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { StarRating } from "@/components/star-rating";
import { AddQuestionDialog } from "@/components/add-question-dialog";
import { EditQuestionDialog } from "@/components/edit-question-dialog";
import { deleteQuestion } from "@/lib/question-actions";

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
  category: Category;
  createdAt: Date;
}

interface QuestionBankProps {
  initialQuestions: Question[];
  categories: Category[];
}

export function QuestionBank({
  initialQuestions,
  categories,
}: QuestionBankProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterCategoryId, setFilterCategoryId] = useState<string>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [, startTransition] = useTransition();

  const filteredQuestions =
    filterCategoryId === "all"
      ? initialQuestions
      : initialQuestions.filter((q) => q.categoryId === filterCategoryId);

  const selectedQuestion = initialQuestions.find((q) => q.id === selectedId) || null;

  function handleDelete() {
    if (!selectedQuestion) return;
    const id = selectedQuestion.id;
    startTransition(async () => {
      try {
        await deleteQuestion(id);
        toast.success("Question deleted");
        setSelectedId(null);
        setDeleteOpen(false);
      } catch {
        toast.error("Failed to delete question");
      }
    });
  }

  return (
    <div className="flex gap-6 h-[calc(100vh-8rem)]">
      {/* Left panel: list */}
      <div className="w-96 shrink-0 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Select value={filterCategoryId} onValueChange={setFilterCategoryId}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2">
          {filteredQuestions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No questions yet. Add one to get started.
            </p>
          ) : (
            filteredQuestions.map((question) => (
              <button
                key={question.id}
                onClick={() => setSelectedId(question.id)}
                className={`w-full text-left rounded-lg border p-3 transition-colors ${
                  selectedId === question.id
                    ? "border-foreground/20 bg-muted"
                    : "border-border hover:bg-muted/50"
                }`}
              >
                <p className="text-sm font-medium line-clamp-2">
                  {question.text}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <Badge variant="secondary" className="text-xs">
                    {question.category.name}
                  </Badge>
                  <StarRating
                    value={question.confidence}
                    readonly
                    size="sm"
                  />
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right panel: detail */}
      <div className="flex-1 rounded-lg border p-6 overflow-y-auto">
        {selectedQuestion ? (
          <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <h2 className="text-lg font-semibold">
                  {selectedQuestion.text}
                </h2>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">
                    {selectedQuestion.category.name}
                  </Badge>
                  <StarRating
                    value={selectedQuestion.confidence}
                    readonly
                  />
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditOpen(true)}
                >
                  <Pencil className="mr-2 h-3.5 w-3.5" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                  Delete
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                STAR Method Answer
              </h3>
              {selectedQuestion.answer ? (
                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                  {selectedQuestion.answer}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  No answer written yet. Click Edit to add one.
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">
              Select a question to view details
            </p>
          </div>
        )}
      </div>

      <AddQuestionDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        categories={categories}
      />
      <EditQuestionDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        question={selectedQuestion}
        categories={categories}
      />
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Question</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this question?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Yes</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
