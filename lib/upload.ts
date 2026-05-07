import path from "node:path";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const MAX_VIDEO_UPLOAD_BYTES = 50 * 1024 * 1024;

const allowedTypes = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["image/gif", ".gif"],
  ["image/avif", ".avif"],
  ["image/heic", ".heic"],
  ["image/heif", ".heif"],
  ["image/svg+xml", ".svg"],
  ["video/mp4", ".mp4"],
  ["video/webm", ".webm"],
  ["video/quicktime", ".mov"]
]);

export function getUploadExtension(type: string, filename?: string) {
  const ext = allowedTypes.get(type);
  if (ext) return ext;

  if (filename) {
    const fileExt = filename.substring(filename.lastIndexOf('.')).toLowerCase();
    const allowedExts = Array.from(allowedTypes.values());
    if (allowedExts.includes(fileExt)) return fileExt;
  }

  return undefined;
}

export function isVideoUpload(type: string, filename?: string) {
  if (type.startsWith("video/")) return true;
  if (filename) {
    const fileExt = filename.substring(filename.lastIndexOf('.')).toLowerCase();
    return [".mp4", ".webm", ".mov"].includes(fileExt);
  }
  return false;
}

export function isSafeUploadPath(filePath: string, uploadsDir: string) {
  const resolvedFile = path.resolve(filePath);
  const resolvedUploads = path.resolve(uploadsDir);

  return resolvedFile.startsWith(resolvedUploads);
}
