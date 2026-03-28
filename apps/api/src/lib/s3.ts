import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const endpoint = process.env.S3_ENDPOINT;
const bucket = process.env.S3_BUCKET;
const publicUrl = process.env.S3_PUBLIC_URL;
const accessKeyId = process.env.S3_ACCESS_KEY;
const secretAccessKey = process.env.S3_SECRET_KEY;

if (!endpoint) throw new Error("S3_ENDPOINT environment variable is required");
if (!bucket) throw new Error("S3_BUCKET environment variable is required");
if (!publicUrl) throw new Error("S3_PUBLIC_URL environment variable is required");
if (!accessKeyId) throw new Error("S3_ACCESS_KEY environment variable is required");
if (!secretAccessKey) throw new Error("S3_SECRET_KEY environment variable is required");

const s3 = new S3Client({
  endpoint,
  region: "us-east-1",
  credentials: { accessKeyId, secretAccessKey },
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
