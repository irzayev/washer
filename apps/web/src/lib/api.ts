const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
}

export async function api<T>(
  path: string,
  init?: RequestInit & { json?: unknown },
): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.json !== undefined) {
    headers.set("Content-Type", "application/json");
  }
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  const body = init?.json !== undefined ? JSON.stringify(init.json) : init?.body;
  const res = await fetch(`${API_BASE}/v1${path}`, {
    ...init,
    headers,
    body,
  });
  if (res.status === 401 && typeof window !== "undefined") {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return (await res.json()) as T;
}

export { API_BASE };
