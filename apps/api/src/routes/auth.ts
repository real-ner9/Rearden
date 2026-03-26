import { Hono } from "hono";
import type { ApiResponse, User } from "@rearden/types";
import { db } from "../lib/db.js";
import { hashPassword, verifyPassword, signToken } from "../lib/auth.js";
import { generateOtp, sendOtp, otpExpiresAt } from "../lib/otp.js";
import { authMiddleware } from "../middleware/auth.js";

export const authRoutes = new Hono();

// TODO: remove — artificial delay for testing loading animations
const DEV_DELAY = () => new Promise((r) => setTimeout(r, 5000));

const PHONE_RE = /^\+?\d{10,15}$/;

function toUser(row: any): User {
  return {
    id: row.id,
    phone: row.phone,
    username: row.username ?? null,
    onboarded: row.onboarded,
    email: row.email ?? null,
    name: row.name ?? null,
    skills: row.skills ?? [],
    topSkills: row.topSkills ?? [],
    experience: row.experience ?? 0,
    videoUrl: row.videoUrl ?? null,
    thumbnailUrl: row.thumbnailUrl ?? null,
    resumeUrl: row.resumeUrl ?? null,
    resumeText: row.resumeText ?? null,
    resume: row.resume ?? null,
    location: row.location ?? "",
    title: row.title ?? "",
    bio: row.bio ?? "",
    availability: row.availability ?? "immediate",
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

// POST /api/auth/send-otp
authRoutes.post("/send-otp", async (c) => {
  await DEV_DELAY();
  const { phone } = await c.req.json<{ phone: string }>();

  if (!phone || !PHONE_RE.test(phone.replace(/[\s()-]/g, ""))) {
    return c.json<ApiResponse>(
      { success: false, error: "Invalid phone number" },
      400
    );
  }

  const code = generateOtp();
  await db.otpCode.create({
    data: {
      phone,
      code,
      expiresAt: otpExpiresAt(),
    },
  });

  sendOtp(phone, code);

  return c.json<ApiResponse>({ success: true, data: null });
});

// POST /api/auth/verify-otp
authRoutes.post("/verify-otp", async (c) => {
  await DEV_DELAY();
  const { phone, code } = await c.req.json<{ phone: string; code: string }>();

  const otp = await db.otpCode.findFirst({
    where: {
      phone,
      code,
      verified: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!otp) {
    return c.json<ApiResponse>(
      { success: false, error: "Invalid or expired code" },
      400
    );
  }

  await db.otpCode.update({
    where: { id: otp.id },
    data: { verified: true },
  });

  const existingUser = await db.user.findUnique({ where: { phone } });

  return c.json<ApiResponse>({
    success: true,
    data: { isNewUser: !existingUser },
  });
});

// POST /api/auth/complete
authRoutes.post("/complete", async (c) => {
  const { phone, code, password, username } = await c.req.json<{
    phone: string;
    code: string;
    password: string;
    username?: string;
  }>();

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

  // Clean up used OTP codes for this phone
  await db.otpCode.deleteMany({ where: { phone } });

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
