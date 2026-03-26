import { Hono } from "hono";
import { extname } from "path";
import type { ApiResponse } from "@rearden/types";
import { uploadToS3 } from "../lib/s3.js";

export const uploadRoutes = new Hono();

// POST /api/upload - Upload file to S3
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
