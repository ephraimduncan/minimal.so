import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { BookmarkList } from "./bookmark-list";
import type { BookmarkItem, GroupItem } from "@/lib/schema";

const mockGroups: GroupItem[] = [
  { id: "group-1", name: "Default", color: "#3b82f6" },
  { id: "group-2", name: "Work", color: "#ef4444" },
];

const createMockBookmark = (overrides: Partial<BookmarkItem> = {}): BookmarkItem => ({
  id: "bookmark-1",
  title: "Test Bookmark",
  url: "https://example.com",
  favicon: null,
  type: "link",
  color: null,
  groupId: "group-1",
  createdAt: new Date("2024-01-15"),
  ...overrides,
});

const defaultProps = {
  bookmarks: [] as BookmarkItem[],
  groups: mockGroups,
  onDelete: vi.fn(),
  onRename: vi.fn(),
  onMove: vi.fn(),
  onRefetch: vi.fn(),
  currentGroupId: "group-1",
  selectedIndex: -1,
  onSelect: vi.fn(),
  renamingId: null,
  onStartRename: vi.fn(),
  onFinishRename: vi.fn(),
  onHoverChange: vi.fn(),
  hoveredIndex: -1,
};

describe("BookmarkList", () => {
  describe("empty state (hoisted JSX optimization)", () => {
    it("renders empty state when bookmarks array is empty", () => {
      render(<BookmarkList {...defaultProps} bookmarks={[]} />);

      expect(screen.getByText("No bookmarks here")).toBeInTheDocument();
      expect(screen.getByText("Add some cool links to get started")).toBeInTheDocument();
    });

    it("returns the same JSX reference for empty state across renders", () => {
      const { rerender, container } = render(
        <BookmarkList {...defaultProps} bookmarks={[]} />
      );

      const firstRenderContent = container.innerHTML;

      rerender(<BookmarkList {...defaultProps} bookmarks={[]} />);

      const secondRenderContent = container.innerHTML;

      expect(firstRenderContent).toBe(secondRenderContent);
    });
  });

  describe("bookmark rendering", () => {
    it("renders bookmarks when array is not empty", () => {
      const bookmarks = [
        createMockBookmark({ id: "1", title: "First Bookmark" }),
        createMockBookmark({ id: "2", title: "Second Bookmark" }),
      ];

      render(<BookmarkList {...defaultProps} bookmarks={bookmarks} />);

      expect(screen.getByText("First Bookmark")).toBeInTheDocument();
      expect(screen.getByText("Second Bookmark")).toBeInTheDocument();
    });

    it("renders column headers", () => {
      const bookmarks = [createMockBookmark()];

      render(<BookmarkList {...defaultProps} bookmarks={bookmarks} />);

      expect(screen.getByText("Title")).toBeInTheDocument();
      expect(screen.getByText("Created At")).toBeInTheDocument();
    });

    it("displays hostname for link bookmarks", () => {
      const bookmarks = [
        createMockBookmark({ url: "https://github.com/example" }),
      ];

      render(<BookmarkList {...defaultProps} bookmarks={bookmarks} />);

      expect(screen.getByText("github.com")).toBeInTheDocument();
    });

    it("strips www from hostname", () => {
      const bookmarks = [
        createMockBookmark({ url: "https://www.example.com/page" }),
      ];

      render(<BookmarkList {...defaultProps} bookmarks={bookmarks} />);

      expect(screen.getByText("example.com")).toBeInTheDocument();
    });
  });

  describe("date formatting", () => {
    it("formats dates in current year without year", () => {
      const currentYear = new Date().getFullYear();
      const bookmarks = [
        createMockBookmark({ createdAt: new Date(`${currentYear}-03-15`) }),
      ];

      render(<BookmarkList {...defaultProps} bookmarks={bookmarks} />);

      expect(screen.getByText("Mar 15")).toBeInTheDocument();
    });

    it("formats dates from previous years with year", () => {
      const bookmarks = [
        createMockBookmark({ createdAt: new Date("2022-06-20") }),
      ];

      render(<BookmarkList {...defaultProps} bookmarks={bookmarks} />);

      expect(screen.getByText("Jun 20, 2022")).toBeInTheDocument();
    });
  });

  describe("conditional rendering (ternary optimization)", () => {
    it("shows date when not selected or hovered", () => {
      const bookmarks = [createMockBookmark({ createdAt: new Date("2022-01-15") })];

      render(
        <BookmarkList
          {...defaultProps}
          bookmarks={bookmarks}
          selectedIndex={-1}
          hoveredIndex={-1}
        />
      );

      expect(screen.getByText("Jan 15, 2022")).toBeInTheDocument();
    });

    it("hides date when bookmark is selected", () => {
      const bookmarks = [createMockBookmark({ createdAt: new Date("2022-01-15") })];

      render(
        <BookmarkList
          {...defaultProps}
          bookmarks={bookmarks}
          selectedIndex={0}
          hoveredIndex={-1}
        />
      );

      expect(screen.queryByText("Jan 15, 2022")).not.toBeInTheDocument();
    });

    it("hides date when bookmark is hovered", () => {
      const bookmarks = [createMockBookmark({ createdAt: new Date("2022-01-15") })];

      render(
        <BookmarkList
          {...defaultProps}
          bookmarks={bookmarks}
          selectedIndex={-1}
          hoveredIndex={0}
        />
      );

      expect(screen.queryByText("Jan 15, 2022")).not.toBeInTheDocument();
    });
  });

  describe("bookmark types", () => {
    it("renders color bookmark with color swatch", () => {
      const bookmarks = [
        createMockBookmark({
          type: "color",
          color: "#ff5733",
          url: null,
        }),
      ];

      const { container } = render(
        <BookmarkList {...defaultProps} bookmarks={bookmarks} />
      );

      const colorSwatch = container.querySelector('[style*="background-color: rgb(255, 87, 51)"]');
      expect(colorSwatch).toBeInTheDocument();
    });

    it("renders text bookmark without URL", () => {
      const bookmarks = [
        createMockBookmark({
          type: "text",
          title: "Plain text note",
          url: null,
        }),
      ];

      render(<BookmarkList {...defaultProps} bookmarks={bookmarks} />);

      expect(screen.getByText("Plain text note")).toBeInTheDocument();
    });
  });
});
