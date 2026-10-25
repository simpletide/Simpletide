import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export const AVATAR_BUCKET = "avatars";
export const MAX_AVATAR_BYTES = 10 * 1024 * 1024;

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);
const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
};
const MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
};

function extensionForFile(file: File): string | null {
  const fromMime = EXT_BY_MIME[file.type];
  if (fromMime) return fromMime;

  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && MIME_BY_EXT[fromName]) return fromName === "jpeg" ? "jpg" : fromName;
  return null;
}

function contentTypeFor(file: File, ext: string): string {
  return file.type && ALLOWED_MIME.has(file.type) ? file.type : MIME_BY_EXT[ext] || "image/jpeg";
}

export function avatarUrlFromUser(user: User | null): string | null {
  if (!user) return null;
  const url = (user.user_metadata as { avatar_url?: string } | undefined)?.avatar_url;
  return url && typeof url === "string" ? url : null;
}

/** Returns an error message, or null if the file is valid. */
export function validateAvatarFile(file: File): string | null {
  const ext = extensionForFile(file);
  if (!ext) return "Please upload a JPG, GIF, PNG, or WebP image.";
  if (file.size > MAX_AVATAR_BYTES) return "Image must be 10MB or smaller.";
  if (file.type && !ALLOWED_MIME.has(file.type)) {
    return "Please upload a JPG, GIF, PNG, or WebP image.";
  }
  return null;
}

function mapUploadError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("bucket") && lower.includes("not found")) {
    return "Photo storage is not configured yet. Please contact support.";
  }
  if (lower.includes("row-level security") || lower.includes("policy")) {
    return "You don't have permission to upload a photo. Try signing out and back in.";
  }
  if (lower.includes("payload too large") || lower.includes("file size")) {
    return "Image must be 10MB or smaller.";
  }
  if (lower.includes("mime") || lower.includes("content type")) {
    return "Please upload a JPG, GIF, PNG, or WebP image.";
  }
  return message || "Could not upload photo. Please try again.";
}

async function removeStaleAvatars(userId: string, keepExt: string): Promise<void> {
  const paths = ["jpg", "jpeg", "png", "gif", "webp"]
    .filter((ext) => ext !== keepExt)
    .map((ext) => `${userId}/avatar.${ext}`);
  if (paths.length === 0) return;
  await supabase.storage.from(AVATAR_BUCKET).remove(paths);
}

/** Uploads to Supabase Storage and saves the public URL on the user profile. */
export async function uploadProfileAvatar(userId: string, file: File): Promise<string> {
  const validationError = validateAvatarFile(file);
  if (validationError) throw new Error(validationError);

  const ext = extensionForFile(file)!;
  const path = `${userId}/avatar.${ext}`;

  await removeStaleAvatars(userId, ext);

  const { error: uploadError } = await supabase.storage.from(AVATAR_BUCKET).upload(path, file, {
    upsert: true,
    contentType: contentTypeFor(file, ext),
    cacheControl: "3600",
  });
  if (uploadError) throw new Error(mapUploadError(uploadError.message));

  const { data: urlData } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
  const publicUrl = `${urlData.publicUrl}?v=${Date.now()}`;

  const { error: updateError } = await supabase.auth.updateUser({
    data: { avatar_url: publicUrl },
  });
  if (updateError) throw new Error(updateError.message || "Could not save profile photo.");

  return publicUrl;
}
