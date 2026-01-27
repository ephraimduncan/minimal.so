"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldContent } from "@/components/ui/field";
import { Form } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { IconSelector } from "@tabler/icons-react";
import { toast } from "sonner";
import type { BookmarkItem, GroupItem } from "@/lib/schema";
import {
  prepareExportData,
  generateCSV,
  generateJSON,
  downloadFile,
  getExportFilename,
} from "@/lib/export";

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "toolbar" | "settings";
  selectedBookmarkIds?: Set<string>;
  bookmarks: BookmarkItem[];
  groups: GroupItem[];
  onExportComplete?: () => void;
}

export function ExportDialog({
  open,
  onOpenChange,
  mode,
  selectedBookmarkIds,
  bookmarks,
  groups,
  onExportComplete,
}: ExportDialogProps) {
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set());
  const [includeNonLinks, setIncludeNonLinks] = useState(true);
  const [format, setFormat] = useState<"csv" | "json">("csv");

  const groupsMap = useMemo(() => {
    return new Map(groups.map((g) => [g.id, g.name]));
  }, [groups]);

  const nonEmptyGroups = useMemo(() => {
    return groups.filter((g) => (g.bookmarkCount ?? 0) > 0);
  }, [groups]);

  useEffect(() => {
    if (open && mode === "settings") {
      setSelectedGroupIds(new Set(groups.map((g) => g.id)));
      setIncludeNonLinks(true);
      setFormat("csv");
    }
  }, [open, mode, groups]);

  const filteredBookmarks = useMemo(() => {
    let filtered = bookmarks;

    if (mode === "toolbar" && selectedBookmarkIds) {
      filtered = filtered.filter((b) => selectedBookmarkIds.has(b.id));
    }

    if (mode === "settings") {
      if (selectedGroupIds.size > 0 && selectedGroupIds.size < groups.length) {
        filtered = filtered.filter((b) => selectedGroupIds.has(b.groupId));
      }

      if (!includeNonLinks) {
        filtered = filtered.filter((b) => b.type === "link");
      }
    }

    return filtered;
  }, [bookmarks, mode, selectedBookmarkIds, selectedGroupIds, groups.length, includeNonLinks]);

  const exportCount = filteredBookmarks.length;

  const handleExport = () => {
    const exportData = prepareExportData(filteredBookmarks, groupsMap);
    const content = format === "csv" ? generateCSV(exportData) : generateJSON(exportData);
    const filename = getExportFilename(format);

    downloadFile(content, filename, format);
    toast.success(
      `Exported ${exportCount} bookmark${exportCount !== 1 ? "s" : ""} as ${format.toUpperCase()}`
    );

    onOpenChange(false);
    onExportComplete?.();
  };

  const handleToggleGroup = (groupId: string, checked: boolean) => {
    setSelectedGroupIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(groupId);
      } else {
        next.delete(groupId);
      }
      return next;
    });
  };

  const handleSelectAllGroups = (checked: boolean) => {
    setSelectedGroupIds(checked ? new Set(groups.map((g) => g.id)) : new Set());
  };

  const selectedGroupsDisplay = useMemo(() => {
    if (selectedGroupIds.size === 0) {
      return "No groups selected";
    }
    if (selectedGroupIds.size === groups.length) {
      return "All groups";
    }
    if (selectedGroupIds.size === 1) {
      const groupId = Array.from(selectedGroupIds)[0];
      return groups.find((g) => g.id === groupId)?.name ?? "1 group";
    }
    return `${selectedGroupIds.size} groups selected`;
  }, [selectedGroupIds, groups]);

  if (mode === "toolbar") {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <Form
          className="contents"
          onSubmit={(e) => {
            e.preventDefault();
            handleExport();
          }}
        >
          <DialogHeader>
            <DialogTitle>Export Bookmarks</DialogTitle>
            <DialogDescription>
              Choose which bookmarks to export and in what format.
            </DialogDescription>
          </DialogHeader>

          <Field>
            <FieldLabel>Groups</FieldLabel>
            <DropdownMenu>
              <DropdownMenuTrigger
                className="rounded-xl w-full"
                render={
                  <Button variant="outline" className="w-full gap-2 px-2 justify-between" />
                }
              >
                <span className="flex-1 text-left">
                  {selectedGroupsDisplay}
                </span>
                <IconSelector className="h-4 w-4 text-muted-foreground shrink-0" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="min-w-[16rem] rounded-xl space-y-1"
              >
                <DropdownMenuCheckboxItem
                  checked={selectedGroupIds.size === groups.length}
                  onCheckedChange={handleSelectAllGroups}
                  className="rounded-lg font-medium"
                >
                  All groups
                </DropdownMenuCheckboxItem>
                {nonEmptyGroups.map((group) => (
                  <DropdownMenuCheckboxItem
                    key={group.id}
                    checked={selectedGroupIds.has(group.id)}
                    onCheckedChange={(checked) => handleToggleGroup(group.id, checked)}
                    className="rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: group.color }}
                      />
                      <span>{group.name}</span>
                    </div>
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </Field>

          <Field orientation="horizontal">
            <Checkbox
              id="include-non-links"
              checked={includeNonLinks}
              onCheckedChange={(checked) => setIncludeNonLinks(checked === true)}
            />
            <FieldContent>
              <FieldLabel htmlFor="include-non-links">
                Include color and text items
              </FieldLabel>
            </FieldContent>
          </Field>

          <div className="space-y-2">
            <FieldLabel>Format</FieldLabel>
            <RadioGroup value={format} onValueChange={(value) => setFormat(value as "csv" | "json")}>
              <Field orientation="horizontal">
                <RadioGroupItem id="format-csv" value="csv" />
                <FieldContent>
                  <FieldLabel htmlFor="format-csv">
                    CSV
                  </FieldLabel>
                </FieldContent>
              </Field>
              <Field orientation="horizontal">
                <RadioGroupItem id="format-json" value="json" />
                <FieldContent>
                  <FieldLabel htmlFor="format-json">
                    JSON
                  </FieldLabel>
                </FieldContent>
              </Field>
            </RadioGroup>
          </div>

          {exportCount > 0 ? (
            <p className="text-sm text-muted-foreground">
              Export {exportCount} bookmark{exportCount !== 1 ? "s" : ""}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Select at least one group with bookmarks to export
            </p>
          )}

          <DialogFooter>
            <DialogClose render={<Button variant="ghost" />}>
              Cancel
            </DialogClose>
            <Button type="submit" disabled={exportCount === 0}>
              Export
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function handleQuickExport(
  format: "csv" | "json",
  bookmarks: BookmarkItem[],
  selectedBookmarkIds: Set<string>,
  groupsMap: Map<string, string>
): void {
  const filteredBookmarks = bookmarks.filter((b) => selectedBookmarkIds.has(b.id));
  const exportData = prepareExportData(filteredBookmarks, groupsMap);
  const content = format === "csv" ? generateCSV(exportData) : generateJSON(exportData);
  const filename = getExportFilename(format);

  downloadFile(content, filename, format);
  toast.success(
    `Exported ${filteredBookmarks.length} bookmark${filteredBookmarks.length !== 1 ? "s" : ""} as ${format.toUpperCase()}`
  );
}
