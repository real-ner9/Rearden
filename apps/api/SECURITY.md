# Security Implementation

This document outlines the security measures implemented in the Rearden API.

## Environment Variables

All sensitive configuration is stored in environment variables with **no fallback values**. The application will fail to start if required variables are missing.

### Required Variables

- `JWT_SECRET` - Secret key for JWT token signing (no default, must be set)
- `DATABASE_URL` - PostgreSQL connection string
- `S3_ENDPOINT` - S3/MinIO endpoint URL (no default)
- `S3_BUCKET` - S3 bucket name (no default)
- `S3_PUBLIC_URL` - Public URL for S3 resources (no default)
- `S3_ACCESS_KEY` - S3 access key ID (no default)
- `S3_SECRET_KEY` - S3 secret access key (no default)

### Optional Variables

- `CORS_ORIGIN` - Allowed CORS origin (defaults to `http://localhost:3000`)
- `NODE_ENV` - Environment mode (`development` or `production`)

## Authentication & Authorization

### JWT Authentication

- Tokens expire after 30 days
- `authMiddleware` validates Bearer tokens on protected routes
- Invalid or expired tokens return 401 Unauthorized

### Protected Routes

All routes that modify data or access user-specific resources require authentication:

- **Auth**: `/api/auth/me` (GET)
- **Profile**: All `/api/me/profile/*` routes
- **Chat**: All `/api/chat/*` routes
- **Posts**: `/api/posts` (POST only)
- **Vacancies**: `/api/vacancies` (POST only)
- **Upload**: `/api/upload` (POST only)

Public routes (no authentication required):
- `/api/posts` (GET) - List posts
- `/api/posts/:id` (GET) - Get single post
- `/api/vacancies` (GET) - List vacancies
- `/api/users` (GET) - List users
- `/api/users/:id` (GET) - Get user profile
- `/api/search` (POST) - Search users

## Rate Limiting

Rate limiting is implemented in-memory to prevent abuse:

### `/api/auth/send-otp`
- **Limit**: 5 requests per 15 minutes per IP
- **Purpose**: Prevent OTP spam

### `/api/auth/verify-otp`
- **Limit**: 10 requests per 15 minutes per IP
- **Purpose**: Prevent brute-force attacks on OTP codes

Rate limit responses include `Retry-After` header indicating seconds until reset.

## Data Privacy

### User Data Mapper

The `toUser()` function in `lib/mappers.ts` ensures sensitive data never leaks to clients:

- **Never exposed**: `passwordHash`
- **Marked as private**: `phone`, `email` (only visible to owner)

All route handlers use this shared mapper to maintain consistent data privacy.

## File Upload Security

File uploads at `/api/upload` are protected with:

1. **Authentication Required**: Must provide valid JWT token
2. **File Size Limit**: Maximum 50MB per file
3. **MIME Type Validation**: Only allowed types:
   - `video/mp4`
   - `video/webm`
   - `image/jpeg`
   - `image/png`
   - `image/webp`
   - `application/pdf`

## Security Headers

All responses include security headers:

- `X-Content-Type-Options: nosniff` - Prevent MIME type sniffing
- `X-Frame-Options: DENY` - Prevent clickjacking
- `X-XSS-Protection: 1; mode=block` - Enable browser XSS protection

## CORS Configuration

CORS is configured with:
- **Origin**: Controlled via `CORS_ORIGIN` environment variable
- **Credentials**: Enabled to support authenticated requests
- **Default**: `http://localhost:3000` for local development

## Development vs Production

### Development Mode

When `NODE_ENV !== "production"`:
- OTP endpoints include 5-second artificial delay for testing loading states
- Additional logging may be enabled

### Production Mode

Production deployments must:
1. Set `NODE_ENV=production`
2. Use strong `JWT_SECRET` (minimum 32 characters)
3. Configure `CORS_ORIGIN` to match frontend domain
4. Use HTTPS for all endpoints
5. Secure S3 bucket with appropriate access policies

## Startup Validation

The API validates all required environment variables on startup (`lib/env.ts`). If any required variable is missing, the application will:
1. Log all missing variables
2. Throw an error with clear instructions
3. Prevent the server from starting

This ensures production deployments cannot run with incomplete configuration.

## Security Checklist

Before deploying to production:

- [ ] `JWT_SECRET` is set to a strong random value (32+ characters)
- [ ] `DATABASE_URL` uses secure credentials
- [ ] S3 credentials are properly secured
- [ ] `CORS_ORIGIN` is set to production frontend domain
- [ ] `NODE_ENV=production` is set
- [ ] HTTPS is enabled on the server
- [ ] Rate limiting thresholds are appropriate for expected traffic
- [ ] Database backups are configured
- [ ] Application logs are monitored for security events
- [ ] S3 bucket has appropriate access policies (public-read for media only)

## Monitoring & Logging

Security-relevant events to monitor:
- Failed authentication attempts (401 responses)
- Rate limit violations (429 responses)
- File upload rejections (invalid type/size)
- Missing environment variables at startup
- JWT verification failures

## Future Enhancements

Consider implementing:
1. Persistent rate limiting (Redis/database-backed)
2. Account lockout after repeated failed login attempts
3. IP-based blocking for repeated violations
4. Content Security Policy (CSP) headers
5. API request logging for audit trails
6. Session management for token revocation
7. Two-factor authentication (2FA)
8. Input sanitization middleware
9. SQL injection protection audits
10. Regular security dependency updates
