"use client";

import { cn } from "@/lib/utils";

export function DietTagChip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "min-h-11 rounded-full px-4 py-2 text-label font-medium transition-colors",
        selected
          ? "bg-primary text-on-primary"
          : "bg-surface-2 text-foreground hover:bg-border"
      )}
    >
      {label}
    </button>
  );
}
