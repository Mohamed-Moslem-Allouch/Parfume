import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export async function GET(request: Request, { params }: { params: Promise<{ filename: string }> }) {
  try {
    const { filename } = await params;
    
    // Security check to prevent directory traversal
    if (filename.includes("/") || filename.includes("\\") || filename.includes("..")) {
      return new NextResponse("Invalid filename", { status: 400 });
    }
    
    const filePath = path.join(process.cwd(), "storage", "uploads", filename);
    const stats = await stat(filePath);
    
    const ext = path.extname(filename).toLowerCase();
    let contentType = "application/octet-stream";
    if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
    else if (ext === ".png") contentType = "image/png";
    else if (ext === ".webp") contentType = "image/webp";
    else if (ext === ".gif") contentType = "image/gif";
    else if (ext === ".avif") contentType = "image/avif";
    else if (ext === ".heic") contentType = "image/heic";
    else if (ext === ".svg") contentType = "image/svg+xml";
    else if (ext === ".mp4") contentType = "video/mp4";
    else if (ext === ".webm") contentType = "video/webm";
    else if (ext === ".mov") contentType = "video/quicktime";
    
    const stream = createReadStream(filePath);
    
    // @ts-ignore - ReadableStream conversion
    const readableStream = new ReadableStream({
      start(controller) {
        stream.on('data', (chunk) => controller.enqueue(chunk));
        stream.on('end', () => controller.close());
        stream.on('error', (err) => controller.error(err));
      }
    });

    return new NextResponse(readableStream, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": stats.size.toString(),
        "Cache-Control": "public, max-age=31536000, immutable"
      }
    });
  } catch (error) {
    return new NextResponse("File not found", { status: 404 });
  }
}
