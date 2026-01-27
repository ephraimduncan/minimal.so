import { base } from "./context";
import {
  listBookmarks,
  createBookmark,
  updateBookmark,
  deleteBookmark,
  refetchBookmark,
  bulkDeleteBookmarks,
  bulkMoveBookmarks,
  listGroups,
  createGroup,
  updateGroup,
  deleteGroup,
} from "./procedures/bookmarks";

export const router = base.router({
  bookmark: {
    list: listBookmarks,
    create: createBookmark,
    update: updateBookmark,
    delete: deleteBookmark,
    refetch: refetchBookmark,
    bulkDelete: bulkDeleteBookmarks,
    bulkMove: bulkMoveBookmarks,
  },
  group: {
    list: listGroups,
    create: createGroup,
    update: updateGroup,
    delete: deleteGroup,
  },
});

export type Router = typeof router;
