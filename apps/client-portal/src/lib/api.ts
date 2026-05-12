const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}/v1${path}`, { next: { revalidate: 60 } });
  if (!res.ok) {
    throw new Error(await res.text());
  }
  return (await res.json()) as T;
}

export { API_BASE };
