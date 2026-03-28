import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { useAuthStore } from "@/stores/authStore";
import { apiFetch } from "@/lib/api";
import { PhoneInput } from "@/components/PhoneInput/PhoneInput";
import type { ApiResponse } from "@rearden/types";
import styles from "./Auth.module.scss";

type Step = "phone" | "otp" | "password";
type OtpStatus = "idle" | "verifying" | "success" | "error";

export function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const login = useAuthStore((s) => s.login);
  const redirectTo = (location.state as { from?: string })?.from || "/feed";

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("+79132537745");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [isNewUser, setIsNewUser] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [phoneValid, setPhoneValid] = useState(true);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [otpStatus, setOtpStatus] = useState<OtpStatus>("idle");

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Redirect if already logged in
  useEffect(() => {
    if (user) navigate(redirectTo, { replace: true });
  }, [user, navigate, redirectTo]);

  // Resend timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handleSendOtp = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const res = await apiFetch<ApiResponse>("/auth/send-otp", {
        method: "POST",
        body: JSON.stringify({ phone }),
      });
      if (!res.success) {
        setError(res.error || "Failed to send code");
        return;
      }
      setStep("otp");
      setResendCooldown(60);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch {
      setError("Failed to send code");
    } finally {
      setLoading(false);
    }
  }, [phone]);

  const handleOtpChange = useCallback(
    (index: number, value: string) => {
      if (!/^\d*$/.test(value)) return;

      const newOtp = [...otp];
      newOtp[index] = value.slice(-1);
      setOtp(newOtp);
      setError("");

      // Auto-focus next
      if (value && index < 5) {
        otpRefs.current[index + 1]?.focus();
      }

      // Auto-submit when all filled
      const code = newOtp.join("");
      if (code.length === 6) {
        verifyOtp(code);
      }
    },
    [otp] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const handleOtpKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent) => {
      if (e.key === "Backspace" && !otp[index] && index > 0) {
        otpRefs.current[index - 1]?.focus();
      }
    },
    [otp]
  );

  const handleOtpPaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
      if (!pasted) return;

      const newOtp = [...otp];
      for (let i = 0; i < pasted.length; i++) {
        newOtp[i] = pasted[i];
      }
      setOtp(newOtp);

      if (pasted.length === 6) {
        verifyOtp(pasted);
      } else if (pasted.length < 6) {
        // Focus next empty field after pasted digits
        const nextIndex = pasted.length;
        if (nextIndex < 6) {
          otpRefs.current[nextIndex]?.focus();
        }
      }
    },
    [otp] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const verifyOtp = async (code: string) => {
    setError("");
    setLoading(true);
    setOtpStatus("verifying");
    try {
      const res = await apiFetch<ApiResponse<{ isNewUser: boolean }>>(
        "/auth/verify-otp",
        {
          method: "POST",
          body: JSON.stringify({ phone, code }),
        }
      );
      if (!res.success) {
        setOtpStatus("error");
        setError(res.error || "Invalid code");
        setTimeout(() => setOtpStatus("idle"), 1500);
        return;
      }
      setOtpStatus("success");
      setIsNewUser(res.data!.isNewUser);
      setTimeout(() => setStep("password"), 600);
    } catch {
      setOtpStatus("error");
      setError("Verification failed");
      setTimeout(() => setOtpStatus("idle"), 1500);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = useCallback(async () => {
    setError("");
    if (isNewUser && !username.trim()) {
      setError("Username is required");
      return;
    }
    if (password.length < 4) {
      setError("Password must be at least 4 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch<
        ApiResponse<{ token: string; user: any }>
      >("/auth/complete", {
        method: "POST",
        body: JSON.stringify({
          phone,
          code: otp.join(""),
          password,
          ...(isNewUser ? { username: username.trim() } : {}),
        }),
      });
      if (!res.success) {
        setError(res.error || "Authentication failed");
        return;
      }
      login(res.data!.token, res.data!.user);
      navigate(redirectTo, { replace: true });
    } catch {
      setError("Authentication failed");
    } finally {
      setLoading(false);
    }
  }, [phone, otp, password, username, isNewUser, login, navigate, redirectTo]);

  const handleResend = useCallback(async () => {
    if (resendCooldown > 0) return;
    setError("");
    setLoading(true);
    try {
      await apiFetch<ApiResponse>("/auth/send-otp", {
        method: "POST",
        body: JSON.stringify({ phone }),
      });
      setResendCooldown(60);
      setOtp(["", "", "", "", "", ""]);
    } catch {
      setError("Failed to resend code");
    } finally {
      setLoading(false);
    }
  }, [phone, resendCooldown]);

  const stepLabel =
    step === "phone"
      ? "Step 1 of 3"
      : step === "otp"
        ? "Step 2 of 3"
        : "Step 3 of 3";

  return (
    <div className={styles.page}>
      <motion.div
        className={styles.card}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className={styles.header}>
          <h1 className={styles.title}>Sign In</h1>
          <p className={styles.subtitle}>
            {step === "phone" && "Enter your phone number to get started"}
            {step === "otp" && `We sent a code to ${phone}`}
            {step === "password" &&
              (isNewUser ? "Create your account" : "Welcome back")}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {step === "phone" && (
            <motion.div
              key="phone"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <div className={styles.field}>
                <label className={styles.label}>Phone number</label>
                <PhoneInput
                  value={phone}
                  onChange={(v) => {
                    setPhone(v);
                    setError("");
                  }}
                  onValidChange={setPhoneValid}
                  onSubmit={handleSendOtp}
                  autoFocus
                />
              </div>
            </motion.div>
          )}

          {step === "otp" && (
            <motion.div
              key="otp"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <div className={styles.otpRow} onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <motion.input
                    key={i}
                    ref={(el: HTMLInputElement | null) => {
                      otpRefs.current[i] = el;
                    }}
                    className={`${styles.otpInput} ${otpStatus === "error" ? styles.otpError : ""} ${otpStatus === "success" ? styles.otpSuccess : ""}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    autoFocus={i === 0}
                    disabled={otpStatus === "verifying" || otpStatus === "success"}
                    animate={
                      otpStatus === "verifying"
                        ? { y: [0, -10, 0], transition: { duration: 0.6, repeat: Infinity, delay: i * 0.09, repeatDelay: 0.85, ease: [0.45, 0, 0.55, 1] } }
                        : otpStatus === "error"
                          ? { x: [0, -4, 4, -4, 4, 0], transition: { duration: 0.4 } }
                          : otpStatus === "success"
                            ? { scale: [1, 1.08, 1], transition: { duration: 0.3, delay: i * 0.05 } }
                            : { y: 0, x: 0, scale: 1 }
                    }
                  />
                ))}
              </div>
              <div className={styles.resend}>
                {resendCooldown > 0 ? (
                  <span>Resend code in {resendCooldown}s</span>
                ) : (
                  <button
                    className={styles.resendLink}
                    onClick={handleResend}
                    disabled={loading}
                  >
                    Resend code
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {step === "password" && (
            <motion.div
              key="password"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              {isNewUser && (
                <div className={styles.field}>
                  <label className={styles.label}>Username</label>
                  <input
                    className={styles.input}
                    type="text"
                    placeholder="Choose a username"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setError("");
                    }}
                    autoFocus
                  />
                </div>
              )}
              <div className={styles.field} style={isNewUser ? { marginTop: 16 } : undefined}>
                <label className={styles.label}>Password</label>
                <input
                  className={styles.input}
                  type="password"
                  placeholder={isNewUser ? "Create a password" : "Enter your password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleComplete()}
                  autoFocus={!isNewUser}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && <p className={styles.error}>{error}</p>}

        {step === "phone" && (
          <button
            className={styles.submitBtn}
            onClick={handleSendOtp}
            disabled={loading || !phone.trim() || !phoneValid}
          >
            {loading ? (
              <span className={styles.dotsLoader}>
                Sending
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className={styles.dot}
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.12, repeatDelay: 0.6, ease: [0.45, 0, 0.55, 1] }}
                  />
                ))}
              </span>
            ) : (
              "Send Code"
            )}
          </button>
        )}

        {step === "password" && (
          <button
            className={styles.submitBtn}
            onClick={handleComplete}
            disabled={loading || !password}
          >
            {loading
              ? "Please wait..."
              : isNewUser
                ? "Create Account"
                : "Sign In"}
          </button>
        )}

        <p className={styles.stepIndicator}>{stepLabel}</p>
      </motion.div>
    </div>
  );
}
