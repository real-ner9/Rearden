import crypto from "node:crypto";

export function generateOtp(): string {
  return String(crypto.randomInt(100000, 999999));
}

export function sendOtp(phone: string, code: string): void {
  console.log(`[SMS] Code for ${phone}: ${code}`);
}

export function otpExpiresAt(): Date {
  return new Date(Date.now() + 5 * 60 * 1000);
}
