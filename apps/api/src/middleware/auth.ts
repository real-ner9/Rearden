import { createMiddleware } from "hono/factory";
import { verifyToken } from "../lib/auth.js";

type AuthEnv = {
  Variables: {
    userId: string;
  };
};

export const authMiddleware = createMiddleware<AuthEnv>(async (c, next) => {
  const header = c.req.header("Authorization");
  if (!header?.startsWith("Bearer ")) {
    return c.json({ success: false, error: "Unauthorized" }, 401);
  }

  try {
    const token = header.slice(7);
    const payload = verifyToken(token);
    c.set("userId", payload.userId);
    await next();
  } catch {
    return c.json({ success: false, error: "Invalid token" }, 401);
  }
});
