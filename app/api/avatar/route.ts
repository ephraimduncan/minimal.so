import { mkdir, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { del, put } from "@vercel/blob";
import { NextResponse } from "next/server";
import sharp from "sharp";
import { getSession } from "@/lib/auth-server";
import { db } from "@/lib/db";

const ACCEPTED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024;
const MAX_AVATAR_DIMENSION = 512;
const LOCAL_AVATAR_URL_PREFIX = "/uploads/avatars/";
const LOCAL_AVATAR_DIR = join(process.cwd(), "public", "uploads", "avatars");

type AvatarStorageProvider = "local" | "vercel";

function getAvatarStorageProvider(): AvatarStorageProvider {
  const configuredProvider = process.env.AVATAR_STORAGE?.toLowerCase();
  if (configuredProvider === "local") return "local";
  if (configuredProvider === "vercel") return "vercel";
  return process.env.NODE_ENV === "production" ? "vercel" : "local";
}

function isBlobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function isVercelBlobUrl(value: string | null | undefined): value is string {
  if (!value) return false;

  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.hostname.endsWith(".public.blob.vercel-storage.com")
    );
  } catch {
    return false;
  }
}

function getLocalAvatarFilename(value: string): string | null {
  try {
    const url = value.startsWith("http://") || value.startsWith("https://")
      ? new URL(value)
      : new URL(value, "http://localhost");

    if (!url.pathname.startsWith(LOCAL_AVATAR_URL_PREFIX)) {
      return null;
    }

    const filename = url.pathname.slice(LOCAL_AVATAR_URL_PREFIX.length);
    if (!filename || filename.includes("/") || filename.includes("\\") || filename.includes("..")) {
      return null;
    }

    return filename;
  } catch {
    return null;
  }
}

function isLocalAvatarUrl(value: string | null | undefined): value is string {
  if (!value) return false;
  return getLocalAvatarFilename(value) !== null;
}

function isErrnoException(error: unknown): error is NodeJS.ErrnoException {
  return typeof error === "object" && error !== null && "code" in error;
}

async function saveLocalAvatar(buffer: Buffer, filename: string): Promise<string> {
  await mkdir(LOCAL_AVATAR_DIR, { recursive: true });
  await writeFile(join(LOCAL_AVATAR_DIR, filename), buffer);
  return `${LOCAL_AVATAR_URL_PREFIX}${filename}`;
}

async function removeLocalAvatar(url: string): Promise<void> {
  const filename = getLocalAvatarFilename(url);
  if (!filename) return;

  try {
    await unlink(join(LOCAL_AVATAR_DIR, filename));
  } catch (error) {
    if (isErrnoException(error) && error.code === "ENOENT") {
      return;
    }
    throw error;
  }
}

async function uploadAvatar(
  storageProvider: AvatarStorageProvider,
  buffer: Buffer,
  userId: string,
): Promise<string> {
  const filename = `${userId}-${Date.now()}.webp`;

  if (storageProvider === "local") {
    return saveLocalAvatar(buffer, filename);
  }

  const uploaded = await put(`avatars/${filename}`, buffer, {
    access: "public",
    contentType: "image/webp",
  });

  return uploaded.url;
}

async function deleteAvatar(url: string): Promise<void> {
  if (isLocalAvatarUrl(url)) {
    await removeLocalAvatar(url);
    return;
  }

  if (isVercelBlobUrl(url) && isBlobConfigured()) {
    await del(url);
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const session = await getSession();
  const storageProvider = getAvatarStorageProvider();

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (storageProvider === "vercel" && !isBlobConfigured()) {
    return NextResponse.json(
      {
        message:
          "Avatar storage is set to Vercel Blob, but BLOB_READ_WRITE_TOKEN is missing",
      },
      { status: 500 },
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { message: "File is required" },
        { status: 400 },
      );
    }

    if (!ACCEPTED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { message: "Only PNG, JPEG, WebP, and GIF are allowed" },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { message: "File size must be 2MB or less" },
        { status: 400 },
      );
    }

    const currentUser = await db.user.findUnique({
      where: { id: session.user.id },
      select: { image: true },
    });

    const inputBuffer = Buffer.from(await file.arrayBuffer());
    const outputBuffer = await sharp(inputBuffer)
      .rotate()
      .resize({
        width: MAX_AVATAR_DIMENSION,
        height: MAX_AVATAR_DIMENSION,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 85 })
      .toBuffer();

    const uploadedUrl = await uploadAvatar(
      storageProvider,
      outputBuffer,
      session.user.id,
    );

    try {
      await db.user.update({
        where: { id: session.user.id },
        data: { image: uploadedUrl },
      });
    } catch (error) {
      try {
        await deleteAvatar(uploadedUrl);
      } catch (cleanupError) {
        console.error("[avatar/post] failed to cleanup upload", cleanupError);
      }
      throw error;
    }

    if (currentUser?.image && currentUser.image !== uploadedUrl) {
      try {
        await deleteAvatar(currentUser.image);
      } catch (error) {
        console.error("[avatar/post] failed to delete previous image", error);
      }
    }

    return NextResponse.json({ url: uploadedUrl });
  } catch (error) {
    console.error("[avatar/post] upload failed", error);
    return NextResponse.json(
      { message: "Failed to upload avatar" },
      { status: 500 },
    );
  }
}

export async function DELETE(): Promise<NextResponse> {
  const session = await getSession();

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const currentUser = await db.user.findUnique({
      where: { id: session.user.id },
      select: { image: true },
    });

    await db.user.update({
      where: { id: session.user.id },
      data: { image: null },
    });

    if (currentUser?.image) {
      try {
        await deleteAvatar(currentUser.image);
      } catch (error) {
        console.error("[avatar/delete] failed to delete blob", error);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[avatar/delete] failed", error);
    return NextResponse.json(
      { message: "Failed to remove avatar" },
      { status: 500 },
    );
  }
}
