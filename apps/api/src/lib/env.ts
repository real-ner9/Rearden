/**
 * Validates all required environment variables at startup.
 * Throws if any required variables are missing.
 */

const requiredEnvVars = [
  "JWT_SECRET",
  "S3_ENDPOINT",
  "S3_BUCKET",
  "S3_PUBLIC_URL",
  "S3_ACCESS_KEY",
  "S3_SECRET_KEY",
  "DATABASE_URL",
] as const;

const missing: string[] = [];

for (const varName of requiredEnvVars) {
  if (!process.env[varName]) {
    missing.push(varName);
  }
}

if (missing.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missing.join(", ")}\n` +
    `Please ensure these are set in your .env file or environment.`
  );
}

console.log("✓ All required environment variables are set");
