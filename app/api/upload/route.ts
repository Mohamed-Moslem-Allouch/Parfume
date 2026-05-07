import crypto from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getUploadExtension, isSafeUploadPath, isVideoUpload, MAX_UPLOAD_BYTES, MAX_VIDEO_UPLOAD_BYTES } from "@/lib/upload";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const files = [...formData.getAll("images"), ...formData.getAll("videos"), ...formData.getAll("media")].filter(
    (value): value is File => value instanceof File
  );

  if (!files.length) {
    return NextResponse.json({ message: "No images were provided." }, { status: 400 });
  }

  const uploadsDir = path.join(process.cwd(), "storage", "uploads");
  await mkdir(uploadsDir, { recursive: true });

  const urls: string[] = [];

  for (const file of files) {
    const extension = getUploadExtension(file.type, file.name);

    if (!extension) {
      return NextResponse.json({ message: "Unsupported file format. Allowed: JPG, PNG, WebP, GIF, AVIF, HEIC, SVG, MP4, WebM, MOV." }, { status: 400 });
    }

    const limit = isVideoUpload(file.type, file.name) ? MAX_VIDEO_UPLOAD_BYTES : MAX_UPLOAD_BYTES;

    if (file.size > limit) {
      return NextResponse.json({ message: isVideoUpload(file.type, file.name) ? "Each video must be 50MB or smaller." : "Each image must be 10MB or smaller." }, { status: 400 });
    }

    const filename = `${crypto.randomUUID()}${extension}`;
    const filePath = path.join(uploadsDir, filename);

    if (!isSafeUploadPath(filePath, uploadsDir)) {
      return NextResponse.json({ message: "Invalid upload path." }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, bytes);
    urls.push(`/uploads/${filename}`);
  }

  return NextResponse.json({ urls });
}
