const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type') && init.body) headers.set('Content-Type', 'application/json');
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }
  const res = await fetch(`${BASE}/api/v1${path}`, { ...init, headers });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  login: (email: string, password: string) =>
    request<{
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
      user: { id: string; email: string; firstName: string; lastName: string; role: string; branchId: string | null };
    }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  me: () => request<{ id: string; email: string; firstName: string; lastName: string; role: string }>('/users/me'),

  dashboard: () =>
    request<{
      activeOrders: number;
      todayOrders: number;
      todayRevenue: number;
      clientsCount: number;
      lowStockItems: number;
    }>('/analytics/dashboard'),

  revenue: (days = 30) => request<{ day: string; revenue: number }[]>(`/analytics/revenue?days=${days}`),

  listClients: (q = '', page = 1) =>
    request<{ items: any[]; total: number; page: number; pageSize: number; totalPages: number }>(
      `/clients?q=${encodeURIComponent(q)}&page=${page}`,
    ),

  listOrders: (page = 1) =>
    request<{ items: any[]; total: number; page: number; pageSize: number; totalPages: number }>(
      `/orders?page=${page}`,
    ),

  listServices: () => request<any[]>('/catalog/services'),
};
