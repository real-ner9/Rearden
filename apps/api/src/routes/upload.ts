import { Hono } from "hono";
import { existsSync, mkdirSync, writeFileSync, readFileSync } from "fs";
import { join, extname } from "path";
import type { ApiResponse } from "@rearden/types";

export const uploadRoutes = new Hono();

const UPLOAD_DIR = join(process.cwd(), "uploads");

// Ensure uploads directory exists
if (!existsSync(UPLOAD_DIR)) {
  mkdirSync(UPLOAD_DIR, { recursive: true });
}

// POST /api/upload - Upload file
uploadRoutes.post("/", async (c) => {
  try {
    const body = await c.req.parseBody();
    const file = body.file;

    if (!file || !(file instanceof File)) {
      return c.json<ApiResponse>(
        {
          success: false,
          error: "No file provided",
        },
        400
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const ext = extname(file.name);
    const filename = `${timestamp}-${crypto.randomUUID()}${ext}`;
    const filepath = join(UPLOAD_DIR, filename);

    // Read file data and write to disk
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    writeFileSync(filepath, buffer);

    return c.json<ApiResponse>({
      success: true,
      data: {
        url: `/api/upload/${filename}`,
        filename,
      },
    });
  } catch (error) {
    return c.json<ApiResponse>(
      {
        success: false,
        error: "Failed to upload file",
      },
      500
    );
  }
});

// GET /api/upload/:filename - Serve uploaded file
uploadRoutes.get("/:filename", (c) => {
  const filename = c.req.param("filename");
  const filepath = join(UPLOAD_DIR, filename);

  if (!existsSync(filepath)) {
    return c.json<ApiResponse>(
      {
        success: false,
        error: "File not found",
      },
      404
    );
  }

  try {
    const fileBuffer = readFileSync(filepath);
    const ext = extname(filename).toLowerCase();

    // Set appropriate content type
    const contentTypeMap: Record<string, string> = {
      ".pdf": "application/pdf",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".webp": "image/webp",
      ".mp4": "video/mp4",
      ".webm": "video/webm",
      ".doc": "application/msword",
      ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ".txt": "text/plain",
    };

    const contentType = contentTypeMap[ext] || "application/octet-stream";

    return c.body(fileBuffer, 200, {
      "Content-Type": contentType,
      "Content-Disposition": `inline; filename="${filename}"`,
    });
  } catch (error) {
    return c.json<ApiResponse>(
      {
        success: false,
        error: "Failed to read file",
      },
      500
    );
  }
});
