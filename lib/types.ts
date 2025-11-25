export interface Group {
  id: string;
  name: string;
  color: string;
}

export type BookmarkType = "link" | "color" | "text";

export interface Bookmark {
  id: string;
  title: string;
  url?: string;
  favicon?: string;
  createdAt: Date;
  groupId: string;
  type: BookmarkType;
  color?: string;
}
