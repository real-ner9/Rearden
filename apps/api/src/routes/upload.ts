import { Hono } from "hono";
import { extname } from "path";
import type { ApiResponse } from "@rearden/types";
import { uploadToS3 } from "../lib/s3.js";
import { authMiddleware } from "../middleware/auth.js";
import { rateLimit } from "../lib/rateLimit.js";

type AuthEnv = { Variables: { userId: string } };

export const uploadRoutes = new Hono<AuthEnv>();

// File upload constraints
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB (for videos)
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB for images
const MAX_PDF_SIZE = 5 * 1024 * 1024; // 5MB for PDFs

const ALLOWED_MIME_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

const ALLOWED_EXTENSIONS = new Set([
  ".mp4",
  ".webm",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".pdf",
]);

// POST /api/upload - Upload file to S3
uploadRoutes.post(
  "/",
  authMiddleware,
  rateLimit({ windowMs: 60_000, maxRequests: 10 }),
  async (c) => {
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

      // Validate file extension
      const ext = extname(file.name).toLowerCase();
      if (!ALLOWED_EXTENSIONS.has(ext)) {
        return c.json<ApiResponse>(
          {
            success: false,
            error: `File extension '${ext}' is not allowed. Allowed extensions: .mp4, .webm, .jpg, .jpeg, .png, .webp, .pdf`,
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

      // Type-specific size limits
      let maxSize = MAX_FILE_SIZE;
      if (file.type.startsWith("image/")) {
        maxSize = MAX_IMAGE_SIZE;
      } else if (file.type === "application/pdf") {
        maxSize = MAX_PDF_SIZE;
      }

      // Validate file size
      if (file.size > maxSize) {
        return c.json<ApiResponse>(
          {
            success: false,
            error: `File size exceeds maximum limit of ${maxSize / 1024 / 1024}MB for ${file.type}`,
          },
          400
        );
      }

      // Generate unique filename (ext already extracted above)
      const timestamp = Date.now();
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
  }
);
