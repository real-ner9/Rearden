import { Hono } from "hono";
import type { ApiResponse, User } from "@rearden/types";
import { db } from "../lib/db.js";
import { hashPassword, verifyPassword, signToken } from "../lib/auth.js";
import { generateOtp, sendOtp, otpExpiresAt } from "../lib/otp.js";
import { authMiddleware } from "../middleware/auth.js";
import { toUser } from "../lib/mappers.js";
import { rateLimit } from "../lib/rateLimit.js";

export const authRoutes = new Hono();

const PHONE_RE = /^\+?\d{10,15}$/;

// POST /api/auth/send-otp
authRoutes.post(
  "/send-otp",
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    keyExtractor: (c) => {
      const body = c.req.raw.clone();
      // Extract phone from request body for rate limiting
      // Note: This is a best-effort approach since body parsing is async
      return c.req.header("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    },
  }),
  async (c) => {
  const { phone } = await c.req.json<{ phone: string }>();

  if (!phone || !PHONE_RE.test(phone.replace(/[\s()-]/g, ""))) {
    return c.json<ApiResponse>(
      { success: false, error: "Invalid phone number" },
      400
    );
  }

  const code = process.env.NODE_ENV === "production" ? generateOtp() : "000000";
  await db.otpCode.create({
    data: {
      phone,
      code,
      expiresAt: otpExpiresAt(),
    },
  });

  sendOtp(phone, code);

  // Only return code in development
  const responseData = process.env.NODE_ENV === "development" ? { code } : {};
  return c.json<ApiResponse>({ success: true, data: responseData });
  }
);

// POST /api/auth/verify-otp
authRoutes.post(
  "/verify-otp",
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 10,
  }),
  async (c) => {
  const { phone, code } = await c.req.json<{ phone: string; code: string }>();

  // Validate code format (exactly 6 digits)
  if (!/^\d{6}$/.test(code)) {
    return c.json<ApiResponse>(
      { success: false, error: "Code must be exactly 6 digits" },
      400
    );
  }

  // Atomically mark the code as verified (prevents race condition)
  const result = await db.otpCode.updateMany({
    where: { phone, code, verified: false, expiresAt: { gt: new Date() } },
    data: { verified: true },
  });

  if (result.count === 0) {
    return c.json<ApiResponse>(
      { success: false, error: "Invalid or expired code" },
      400
    );
  }

  const existingUser = await db.user.findUnique({ where: { phone } });

  return c.json<ApiResponse>({
    success: true,
    data: { isNewUser: !existingUser },
  });
  }
);

// POST /api/auth/complete
authRoutes.post("/complete", async (c) => {
  const { phone, code, password, username } = await c.req.json<{
    phone: string;
    code: string;
    password: string;
    username?: string;
  }>();

  // Validate password strength (minimum 8 characters)
  if (!password || password.length < 8) {
    return c.json<ApiResponse>(
      { success: false, error: "Password must be at least 8 characters long" },
      400
    );
  }

  // Verify OTP was verified
  const otp = await db.otpCode.findFirst({
    where: {
      phone,
      code,
      verified: true,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!otp) {
    return c.json<ApiResponse>(
      { success: false, error: "OTP not verified" },
      400
    );
  }

  // Delete OTP immediately to prevent replay
  await db.otpCode.delete({ where: { id: otp.id } });

  let user = await db.user.findUnique({ where: { phone } });

  if (user) {
    // Existing user — verify password
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return c.json<ApiResponse>(
        { success: false, error: "Wrong password" },
        401
      );
    }
  } else {
    // New user — require username
    if (!username?.trim()) {
      return c.json<ApiResponse>(
        { success: false, error: "Username is required for new accounts" },
        400
      );
    }

    user = await db.user.create({
      data: {
        phone,
        passwordHash: await hashPassword(password),
        username: username.trim(),
        onboarded: true,
      },
    });
  }

  const token = signToken(user.id);

  return c.json<ApiResponse>({
    success: true,
    data: {
      token,
      user: toUser(user),
    },
  });
});

// GET /api/auth/me — protected
authRoutes.get("/me", authMiddleware, async (c) => {
  const userId = c.get("userId");
  const user = await db.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return c.json<ApiResponse>(
      { success: false, error: "User not found" },
      404
    );
  }

  return c.json<ApiResponse>({
    success: true,
    data: toUser(user),
  });
});
