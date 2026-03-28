import { useAuthStore } from "@/stores/authStore";

const API_BASE = "/api";

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = useAuthStore.getState().token;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    useAuthStore.getState().logout();
    if (window.location.pathname !== "/auth") {
      window.location.href = "/auth";
    }
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    let errorMessage = `API Error: ${res.status}`;
    try {
      const body = await res.json();
      if (body?.error) errorMessage = body.error;
    } catch {
      // Non-JSON response, use default error message
    }
    throw new Error(errorMessage);
  }

  // Handle non-JSON responses gracefully
  try {
    return await res.json();
  } catch {
    throw new Error("Invalid JSON response from server");
  }
}
