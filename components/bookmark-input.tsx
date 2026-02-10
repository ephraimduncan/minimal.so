"use client";

import type React from "react";
import { forwardRef, useEffect } from "react";
import { IconPlus } from "@tabler/icons-react";
import { Input } from "@/components/ui/input";
import { Kbd, KbdGroup } from "@/components/ui/kbd";

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
        <Input
          ref={ref}
          className="peer ps-8 pe-16"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder="Insert a link, color, or just plain text..."
        />
        <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-2.5 text-muted-foreground/80 peer-disabled:opacity-50">
          <IconPlus size={16} />
        </div>
        <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center justify-center pe-2 text-muted-foreground/80 peer-disabled:opacity-50">
          <KbdGroup>
            <Kbd>⌘</Kbd>
            <Kbd>F</Kbd>
          </KbdGroup>
        </div>
      </div>
    );
  },
);
