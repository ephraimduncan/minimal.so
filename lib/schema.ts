import { z } from "zod";

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  emailVerified: z.boolean(),
  image: z.string().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const sessionDataSchema = z.object({
  id: z.string(),
  expiresAt: z.date(),
  token: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  ipAddress: z.string().nullable().optional(),
  userAgent: z.string().nullable().optional(),
  userId: z.string(),
});

export const sessionSchema = z
  .object({
    user: userSchema,
    session: sessionDataSchema,
  })
  .nullable();

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

export type User = z.infer<typeof userSchema>;
export type SessionData = z.infer<typeof sessionDataSchema>;
export type Session = z.infer<typeof sessionSchema>;
export type BookmarkType = z.infer<typeof bookmarkTypeSchema>;
export type Group = z.infer<typeof groupSchema>;
export type GroupItem = z.infer<typeof groupItemSchema>;
export type Bookmark = z.infer<typeof bookmarkSchema>;
export type BookmarkItem = z.infer<typeof bookmarkItemSchema>;
export type CreateBookmark = z.infer<typeof createBookmarkSchema>;
export type UpdateBookmark = z.infer<typeof updateBookmarkSchema>;
export type CreateGroup = z.infer<typeof createGroupSchema>;
export type UpdateGroup = z.infer<typeof updateGroupSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
