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
  setBookmarkVisibility,
  bulkSetVisibility,
  setGroupVisibility,
} from "./procedures/bookmarks";
import {
  getProfile,
  updateProfile,
  checkUsername,
} from "./procedures/profile";
import { getPublicProfile } from "./procedures/public";

export const router = base.router({
  bookmark: {
    list: listBookmarks,
    create: createBookmark,
    update: updateBookmark,
    delete: deleteBookmark,
    refetch: refetchBookmark,
    bulkDelete: bulkDeleteBookmarks,
    bulkMove: bulkMoveBookmarks,
    setVisibility: setBookmarkVisibility,
    bulkSetVisibility: bulkSetVisibility,
  },
  group: {
    list: listGroups,
    create: createGroup,
    update: updateGroup,
    delete: deleteGroup,
    setVisibility: setGroupVisibility,
  },
  profile: {
    get: getProfile,
    update: updateProfile,
    checkUsername: checkUsername,
  },
  public: {
    getProfile: getPublicProfile,
  },
});

export type Router = typeof router;
