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
      user: { id: string; email: string; firstName: string; lastName: string; role: string; branchId: string | null };
    }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  me: () => request<any>('/users/me'),

  dashboard: () =>
    request<{
      activeOrders: number;
      todayOrders: number;
      todayRevenue: number;
      clientsCount: number;
      lowStockItems: number;
    }>('/analytics/dashboard'),

  revenue: (days = 30) => request<{ day: string; revenue: number }[]>(`/analytics/revenue?days=${days}`),
  topServices: (days = 30) => request<any[]>(`/analytics/top-services?days=${days}`),
  topEmployees: (days = 30) => request<any[]>(`/analytics/top-employees?days=${days}`),
  boxLoad: () => request<any[]>('/analytics/box-load'),
  clientSegments: () => request<{ total: number; vip: number; inactive: number; frequent: number }>('/clients/segments/summary'),

  listClients: (q = '', page = 1, pageSize = 20) =>
    request<{ items: any[]; total: number; page: number; pageSize: number; totalPages: number }>(
      `/clients?q=${encodeURIComponent(q)}&page=${page}&pageSize=${pageSize}`,
    ),
  getClient: (id: string) => request<any>(`/clients/${id}`),
  clientHistory: (id: string) => request<any[]>(`/clients/${id}/history`),
  createClient: (body: {
    phone: string;
    firstName: string;
    lastName?: string;
    email?: string;
    vehicle?: { plate?: string; make?: string; model?: string };
  }) => request<any>('/clients', { method: 'POST', body: JSON.stringify(body) }),
  updateClient: (id: string, body: Record<string, unknown>) =>
    request<any>(`/clients/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

  listOrders: (page = 1, status?: OrderStatus) => {
    const q = new URLSearchParams({ page: String(page) });
    if (status) q.set('status', status);
    return request<{ items: any[]; total: number }>(`/orders?${q}`);
  },
  getOrder: (id: string) => request<any>(`/orders/${id}`),
  createOrder: (body: { clientId: string; vehicleId?: string; notes?: string; items: { serviceId: string; qty?: number }[] }) =>
    request<any>('/orders', { method: 'POST', body: JSON.stringify(body) }),
  updateOrderStatus: (id: string, status: OrderStatus) =>
    request<any>(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  previewClose: (id: string, body: { bonusUsed?: number; discounts?: { type: string; value: number; reason: string }[] }) =>
    request<PricingPreview>(`/orders/${id}/preview-close`, { method: 'POST', body: JSON.stringify(body) }),
  closeOrder: (
    id: string,
    body: {
      bonusUsed?: number;
      discounts?: { type: string; value: number; reason: string }[];
      payments: { method: PaymentMethod; amount: number }[];
      idempotencyKey: string;
    },
  ) => request<any>(`/orders/${id}/close`, { method: 'POST', body: JSON.stringify(body) }),
  receiptUrl: (orderId: string) => `${BASE}/api/v1/invoices/order/${orderId}/receipt.html`,

  listCategories: () => request<any[]>('/catalog/categories'),
  listServices: () => request<any[]>('/catalog/services'),
  createService: (body: Record<string, unknown>) =>
    request<any>('/catalog/services', { method: 'POST', body: JSON.stringify(body) }),
  updateService: (id: string, body: Record<string, unknown>) =>
    request<any>(`/catalog/services/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  listPackages: () => request<any[]>('/catalog/packages'),
  listPromotions: () => request<any[]>('/catalog/promotions'),

  listAppointments: (from?: string, to?: string) => {
    const q = new URLSearchParams();
    if (from) q.set('from', from);
    if (to) q.set('to', to);
    return request<any[]>(`/appointments?${q}`);
  },
  createAppointment: (body: Record<string, unknown>) =>
    request<any>('/appointments', { method: 'POST', body: JSON.stringify(body) }),
  cancelAppointment: (id: string) => request<any>(`/appointments/${id}/cancel`, { method: 'POST' }),
  convertAppointment: (id: string) => request<any>(`/appointments/${id}/convert-order`, { method: 'POST' }),

  listInventory: () => request<any[]>('/inventory'),
  receiveStock: (body: { itemId: string; qty: number; unitCost: number; note?: string }) =>
    request<any>('/inventory/receive', { method: 'POST', body: JSON.stringify(body) }),

  cashCurrent: () => request<any | null>('/cash-register/current'),
  cashOpen: (cash: number) =>
    request<any>('/cash-register/open', { method: 'POST', body: JSON.stringify({ cash }) }),
  cashClose: (cash: number) =>
    request<any>('/cash-register/close', { method: 'POST', body: JSON.stringify({ cash }) }),
  cashReport: (shiftId: string) => request<any>(`/cash-register/report/${shiftId}`),

  listUsers: () => request<any[]>('/users'),
  createUser: (body: Record<string, unknown>) =>
    request<any>('/users', { method: 'POST', body: JSON.stringify(body) }),

  listRefunds: () => request<any[]>('/refunds'),
  createRefund: (body: { paymentId: string; amount: number; reason: string }) =>
    request<any>('/refunds', { method: 'POST', body: JSON.stringify(body) }),

  listPayrollProfiles: () => request<any[]>('/payroll/profiles'),
  createSalaryRun: (periodFrom: string, periodTo: string) =>
    request<any>('/payroll/runs', {
      method: 'POST',
      body: JSON.stringify({ periodFrom, periodTo }),
    }),
  listSalaryRuns: () => request<any[]>('/payroll/runs'),

  listBoxes: () => request<any[]>('/boxes'),

  clientBonus: (clientId: string) => request<any>(`/bonuses/clients/${clientId}/wallet`),
  clientBonusHistory: (clientId: string) => request<any[]>(`/bonuses/clients/${clientId}/history`),

  aiChat: (prompt: string) =>
    request<{ reply: string }>('/ai/chat', { method: 'POST', body: JSON.stringify({ prompt }) }),
};

export const publicApi = {
  bookAppointment: (branchCode: string, body: Record<string, unknown>) =>
    fetch(`${BASE}/api/v1/appointments/public/book/${branchCode}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then(async (r) => {
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    }),
  lookupClient: (branchCode: string, phone: string) =>
    fetch(`${BASE}/api/v1/clients/public/lookup?branchCode=${branchCode}&phone=${encodeURIComponent(phone)}`).then(
      async (r) => {
        if (!r.ok) throw new Error('Not found');
        return r.json();
      },
    ),
  listServices: () =>
    fetch(`${BASE}/api/v1/catalog/services`).then((r) => r.json()),
};
