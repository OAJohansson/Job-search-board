"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
  size?: "sm" | "md";
}

export function StarRating({
  value,
  onChange,
  readonly = false,
  size = "md",
}: StarRatingProps) {
  const sizeClass = size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5";

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const icon = (
          <Star
            className={cn(
              sizeClass,
              star <= value
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground/30"
            )}
          />
        );
        return readonly ? (
          <span key={star} className="cursor-default">
            {icon}
          </span>
        ) : (
          <button
            key={star}
            type="button"
            onClick={() => onChange?.(star)}
            className="cursor-pointer transition-colors hover:text-yellow-400"
          >
            {icon}
          </button>
        );
      })}
    </div>
  );
}
