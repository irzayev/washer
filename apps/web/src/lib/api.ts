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
    let message = `HTTP ${res.status}`;
    try {
      const j = JSON.parse(await res.text());
      message = j.message ?? (Array.isArray(j.message) ? j.message.join(', ') : message);
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export type PaymentMethod = 'CASH' | 'POS' | 'AZERICARD' | 'TRANSFER' | 'BONUS';
export type OrderStatus =
  | 'NEW'
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'WAITING'
  | 'COMPLETED'
  | 'DELIVERED'
  | 'CANCELLED';

export interface PricingPreview {
  subtotal: number;
  discountTotal: number;
  bonusUsed: number;
  vatTotal: number;
  grandTotal: number;
  bonusEarned: number;
  bonusBalance: number;
  bonusMaxUsable: number;
}

export const api = {
  login: (email: string, password: string) =>
    request<{
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
      user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: string;
        branchId: string | null;
      };
    }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  me: () =>
    request<{ id: string; email: string; firstName: string; lastName: string; role: string }>(
      '/users/me',
    ),

  dashboard: () =>
    request<{
      activeOrders: number;
      todayOrders: number;
      todayRevenue: number;
      clientsCount: number;
      lowStockItems: number;
    }>('/analytics/dashboard'),

  revenue: (days = 30) => request<{ day: string; revenue: number }[]>(`/analytics/revenue?days=${days}`),

  listClients: (q = '', page = 1, pageSize = 20) =>
    request<{ items: any[]; total: number; page: number; pageSize: number; totalPages: number }>(
      `/clients?q=${encodeURIComponent(q)}&page=${page}&pageSize=${pageSize}`,
    ),

  createClient: (body: {
    phone: string;
    firstName: string;
    lastName?: string;
    email?: string;
    vehicle?: { plate?: string; make?: string; model?: string };
  }) => request<any>('/clients', { method: 'POST', body: JSON.stringify(body) }),

  listOrders: (page = 1, status?: OrderStatus) => {
    const q = new URLSearchParams({ page: String(page) });
    if (status) q.set('status', status);
    return request<{ items: any[]; total: number; page: number; pageSize: number; totalPages: number }>(
      `/orders?${q}`,
    );
  },

  getOrder: (id: string) => request<any>(`/orders/${id}`),

  createOrder: (body: {
    clientId: string;
    vehicleId?: string;
    notes?: string;
    items: { serviceId: string; qty?: number }[];
  }) => request<any>('/orders', { method: 'POST', body: JSON.stringify(body) }),

  updateOrderStatus: (id: string, status: OrderStatus) =>
    request<any>(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  previewClose: (id: string, body: { bonusUsed?: number; discounts?: { type: string; value: number; reason: string }[] }) =>
    request<PricingPreview>(`/orders/${id}/preview-close`, { method: 'POST', body: JSON.stringify(body) }),

  closeOrder: (
    id: string,
    body: {
      bonusUsed?: number;
      discounts?: { type: string; value: number; reason: string; comment?: string }[];
      payments: { method: PaymentMethod; amount: number }[];
      idempotencyKey: string;
    },
  ) => request<any>(`/orders/${id}/close`, { method: 'POST', body: JSON.stringify(body) }),

  listServices: () => request<any[]>('/catalog/services'),
};
