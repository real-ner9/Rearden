import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const endpoint = process.env.S3_ENDPOINT || "http://localhost:9002";
const bucket = process.env.S3_BUCKET || "rearden-media";
const publicUrl = process.env.S3_PUBLIC_URL || `${endpoint}/${bucket}`;

const s3 = new S3Client({
  endpoint,
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || "rearden",
    secretAccessKey: process.env.S3_SECRET_KEY || "reardenpass",
  },
  forcePathStyle: true,
});

export async function uploadToS3(
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );

  return `${publicUrl}/${key}`;
}
