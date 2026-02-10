import type { BookmarkItem } from "@/lib/schema";

export interface ExportBookmark {
  title: string;
  url: string | null;
  type: string;
  color: string | null;
  groupName: string;
  createdAt: string;
}

export function generateCSV(bookmarks: ExportBookmark[]): string {
  const headers = ["title", "url", "type", "color", "groupName", "createdAt"];
  const csvRows = [headers.join(",")];

  for (const bookmark of bookmarks) {
    const row = headers.map((header) => {
      const value = bookmark[header as keyof ExportBookmark];
      const stringValue = value === null ? "" : String(value);

      if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    });
    csvRows.push(row.join(","));
  }

  return csvRows.join("\n");
}

export function generateJSON(bookmarks: ExportBookmark[]): string {
  return JSON.stringify(bookmarks, null, 2);
}

export function downloadFile(
  content: string,
  filename: string,
  type: "csv" | "json"
): void {
  const mimeType = type === "csv" ? "text/csv" : "application/json";
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function getExportFilename(type: "csv" | "json"): string {
  const date = new Date().toISOString().split("T")[0];
  return `minimal.so-${date}.${type}`;
}

export function prepareExportData(
  bookmarks: BookmarkItem[],
  groupsMap: Map<string, string>
): ExportBookmark[] {
  return bookmarks.map((bookmark) => ({
    title: bookmark.title,
    url: bookmark.url,
    type: bookmark.type,
    color: bookmark.color ?? null,
    groupName: groupsMap.get(bookmark.groupId) ?? "Unknown",
    createdAt:
      typeof bookmark.createdAt === "string"
        ? bookmark.createdAt
        : bookmark.createdAt.toISOString(),
  }));
}
