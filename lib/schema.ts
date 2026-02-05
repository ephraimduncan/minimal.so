import { z } from "zod";

const RESERVED_USERNAMES = new Set([
  "login",
  "signup",
  "dashboard",
  "settings",
  "public",
  "admin",
  "api",
  "rpc",
  "u",
  "chrome",
]);

export const usernameSchema = z
  .string()
  .min(3, "Username must be at least 3 characters")
  .max(39, "Username must be at most 39 characters")
  .regex(
    /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/,
    "Lowercase letters, numbers, and hyphens only. Must start and end with a letter or number.",
  )
  .refine((val) => !val.includes("--"), "Username cannot contain consecutive hyphens")
  .refine((val) => !RESERVED_USERNAMES.has(val), "This username is reserved");

export const updateProfileSchema = z.object({
  username: usernameSchema.nullable(),
  bio: z.string().max(160).nullable(),
  github: z.string().max(39).nullable(),
  twitter: z.string().max(15).nullable(),
  website: z
    .string()
    .max(200)
    .transform((val) => {
      if (!val) return val;
      return val.startsWith("http://") || val.startsWith("https://")
        ? val
        : `https://${val}`;
    })
    .pipe(z.string().url("Invalid website URL").or(z.literal("")))
    .nullable(),
  isProfilePublic: z.boolean(),
});

export const bookmarkTypeSchema = z.enum(["link", "color", "text"]);

export const groupSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string(),
  userId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const groupItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string(),
  isPublic: z.boolean().optional(),
  bookmarkCount: z.number().optional(),
});

export const bookmarkSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string().nullable().optional(),
  favicon: z.string().nullable().optional(),
  type: bookmarkTypeSchema,
  color: z.string().nullable().optional(),
  groupId: z.string(),
  userId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const bookmarkItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string().nullable(),
  favicon: z.string().nullable().optional(),
  type: z.string(),
  color: z.string().nullable().optional(),
  isPublic: z.boolean().nullable().optional(),
  groupId: z.string(),
  createdAt: z.union([z.date(), z.string()]),
});

export const createBookmarkSchema = z.object({
  title: z.string(),
  url: z.string().optional(),
  type: bookmarkTypeSchema.default("link"),
  color: z.string().optional(),
  groupId: z.string(),
});

export const updateBookmarkSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  url: z.string().optional(),
  type: bookmarkTypeSchema.optional(),
  color: z.string().optional(),
  groupId: z.string().optional(),
});

export const createGroupSchema = z.object({
  name: z.string(),
  color: z.string(),
});

export const updateGroupSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  color: z.string().optional(),
});

export const listBookmarksInputSchema = z.object({
  groupId: z.string().optional(),
});

export const deleteByIdSchema = z.object({
  id: z.string(),
});

export const bulkDeleteBookmarksSchema = z.object({
  ids: z.array(z.string()).min(1, "At least one bookmark ID required"),
});

export const bulkMoveBookmarksSchema = z.object({
  ids: z.array(z.string()).min(1),
  targetGroupId: z.string(),
});

export const signupSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    email: z.email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type BookmarkType = z.infer<typeof bookmarkTypeSchema>;
export type Group = z.infer<typeof groupSchema>;
export type GroupItem = z.infer<typeof groupItemSchema>;
export type Bookmark = z.infer<typeof bookmarkSchema>;
export type BookmarkItem = z.infer<typeof bookmarkItemSchema>;
export type CreateBookmark = z.infer<typeof createBookmarkSchema>;
export type UpdateBookmark = z.infer<typeof updateBookmarkSchema>;
export type CreateGroup = z.infer<typeof createGroupSchema>;
export type UpdateGroup = z.infer<typeof updateGroupSchema>;
export type UpdateProfile = z.infer<typeof updateProfileSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
