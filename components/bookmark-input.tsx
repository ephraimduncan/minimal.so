"use client";

import type React from "react";
import { forwardRef, useEffect } from "react";
import { Plus } from "lucide-react";

interface BookmarkInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
}

export const BookmarkInput = forwardRef<HTMLInputElement, BookmarkInputProps>(
  function BookmarkInput({ value, onChange, onSubmit }, ref) {
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === "f") {
          e.preventDefault();
          if (ref && "current" in ref && ref.current) {
            ref.current.focus();
          }
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [ref]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && value.trim()) {
        onSubmit(value.trim());
        onChange("");
      }
      if (e.key === "Escape") {
        if (ref && "current" in ref && ref.current) {
          ref.current.blur();
        }
      }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
      const pastedText = e.clipboardData.getData("text");
      if (pastedText.includes("\n")) {
        e.preventDefault();
        onSubmit(pastedText);
      }
    };

    return (
      <div className="relative mb-8">
        <div className="flex items-center rounded-lg border border-border bg-background py-2 focus-within:ring-2 focus-within:ring-ring gap-0 px-2">
          <Plus className="h-5 w-5 text-muted-foreground mr-1.5" />
          <input
            ref={ref}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder="Insert a link, color, or just plain text..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <div className="flex items-center gap-1">
            <kbd className="rounded border border-border bg-muted text-xs font-medium text-muted-foreground font-serif py-0.5 px-1">
              ⌘
            </kbd>
            <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
              F
            </kbd>
          </div>
        </div>
      </div>
    );
  }
);
