"use client";

import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  IconListCheck,
  IconX,
  IconDragDrop,
  IconCopyCheckFilled,
  IconTrash,
  IconFileExport,
  IconFileTypeCsv,
  IconJson,
  IconWorld,
  IconWorldOff,
} from "@tabler/icons-react";

interface MultiSelectToolbarProps {
  selectedCount: number;
  onSelectAll: () => void;
  onMove: () => void;
  onCopyUrls: () => void;
  onExport: (format: "csv" | "json") => void;
  onDelete: () => void;
  onClose: () => void;
  hasUsername?: boolean;
  onMakePublic?: () => void;
  onMakePrivate?: () => void;
}

export function MultiSelectToolbar({
  selectedCount,
  onSelectAll,
  onMove,
  onCopyUrls,
  onExport,
  onDelete,
  onClose,
  hasUsername,
  onMakePublic,
  onMakePrivate,
}: MultiSelectToolbarProps) {
  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 motion-reduce:transition-none motion-reduce:animate-none"
    >
      <div className="flex items-center rounded-lg bg-popover text-popover-foreground p-1 shadow-md ring-1 ring-foreground/10">
        <Button
          variant="ghost"
          size="sm"
          onClick={onSelectAll}
          className="gap-1.5 rounded-md px-1.5 py-1 h-auto text-[13px] hover:bg-accent hover:text-accent-foreground"
        >
          <IconListCheck className="h-4 w-4" />
          Select All
        </Button>
        <div className="h-4 w-px bg-border mx-0.5 -my-1" />
        <Button
          variant="ghost"
          size="sm"
          onClick={onMove}
          className="gap-1.5 rounded-md px-1.5 py-1 h-auto text-[13px] hover:bg-accent hover:text-accent-foreground"
        >
          <IconDragDrop className="h-4 w-4" />
          Move
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCopyUrls}
          className="gap-1.5 rounded-md px-1.5 py-1 h-auto text-[13px] hover:bg-accent hover:text-accent-foreground"
        >
          <IconCopyCheckFilled className="h-4 w-4" />
          Copy URLs
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 rounded-md px-1.5 py-1 h-auto text-[13px] hover:bg-accent hover:text-accent-foreground"
              />
            }
          >
            <IconFileExport className="h-4 w-4" />
            Export
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="w-40">
            <DropdownMenuItem onClick={() => onExport("csv")} className="whitespace-nowrap">
              <IconFileTypeCsv className="h-4 w-4" />
              Export as CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExport("json")} className="whitespace-nowrap">
              <IconJson className="h-4 w-4" />
              Export as JSON
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {hasUsername && onMakePublic && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onMakePublic}
            className="gap-1.5 rounded-md px-1.5 py-1 h-auto text-[13px] hover:bg-accent hover:text-accent-foreground"
          >
            <IconWorld className="h-4 w-4" />
            Public
          </Button>
        )}
        {hasUsername && onMakePrivate && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onMakePrivate}
            className="gap-1.5 rounded-md px-1.5 py-1 h-auto text-[13px] hover:bg-accent hover:text-accent-foreground"
          >
            <IconWorldOff className="h-4 w-4" />
            Private
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="gap-1.5 rounded-md px-1.5 py-1 h-auto text-[13px] text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <IconTrash className="h-4 w-4" />
          Delete
        </Button>
        <div className="h-4 w-px bg-border mx-0.5" />
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="rounded-md p-1 h-auto hover:bg-accent hover:text-accent-foreground"
          aria-label="Close multi-select toolbar"
        >
          <IconX className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}
