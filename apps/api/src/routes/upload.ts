import { Hono } from "hono";
import { extname } from "path";
import type { ApiResponse } from "@rearden/types";
import { uploadToS3 } from "../lib/s3.js";
import { authMiddleware } from "../middleware/auth.js";

type AuthEnv = { Variables: { userId: string } };

export const uploadRoutes = new Hono<AuthEnv>();

// File upload constraints
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_MIME_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

// POST /api/upload - Upload file to S3
uploadRoutes.post("/", authMiddleware, async (c) => {
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

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return c.json<ApiResponse>(
        {
          success: false,
          error: `File size exceeds maximum limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        },
        400
      );
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return c.json<ApiResponse>(
        {
          success: false,
          error: `File type '${file.type}' is not allowed. Allowed types: video/mp4, video/webm, image/jpeg, image/png, image/webp, application/pdf`,
        },
        400
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const ext = extname(file.name);
    const filename = `${timestamp}-${crypto.randomUUID()}${ext}`;

    // Upload to S3
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const url = await uploadToS3(buffer, filename, file.type);

    return c.json<ApiResponse>({
      success: true,
      data: {
        url,
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
