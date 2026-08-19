import type {
  User,
  Property,
  Paginated,
  Inquiry,
  Favorite,
  Lease,
  Payment,
  Receipt,
  Contract,
  Review,
  SiteSettings,
  ManagedUser,
} from '../types/index';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
const USE_COOKIE_AUTH = process.env.NEXT_PUBLIC_USE_COOKIE_AUTH === 'true';

const API_BASE = API_URL.replace(/\/api\/?$/, '')
let csrfPromise: Promise<void> | null = null
function ensureCsrf(): Promise<void> {
  if (!USE_COOKIE_AUTH) return Promise.resolve()
  if (csrfPromise) return csrfPromise
  csrfPromise = fetch(`${API_BASE}/sanctum/csrf-cookie`, { credentials: 'include' })
    .then(() => {})
    .catch(() => {})
  return csrfPromise
}

export class ApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;

  constructor(message: string, status = 500, errors?: Record<string, string[]>) {
    super(message);
    this.status = status;
    this.errors = errors;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

function getToken(): string | null {
  try {
    return typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  } catch {
    return null;
  }
}

export function normalizeListResponse<T>(payload: T[] | { data?: T[]; items?: T[]; results?: T[]; properties?: T[] } | null | undefined): T[] {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];

  const candidate = payload as { data?: T[]; items?: T[]; results?: T[]; properties?: T[] };
  if (Array.isArray(candidate.data)) return candidate.data;
  if (Array.isArray(candidate.items)) return candidate.items;
  if (Array.isArray(candidate.results)) return candidate.results;
  if (Array.isArray(candidate.properties)) return candidate.properties;

  return [];
}

export function setToken(token: string) {
  try {
    localStorage.setItem('auth_token', token);
  } catch {}
}

type ApiRequestOptions = Omit<RequestInit, 'body'> & {
  body?: any;
  headers?: Record<string, string>;
};

async function request<T>(path: string, opts: ApiRequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(opts.headers || {}),
  } as Record<string, string>;

  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  // If using cookie-based Sanctum auth, ensure CSRF cookie is set and include credentials
  if (USE_COOKIE_AUTH) {
    // call CSRF endpoint before non-GET requests
    const method = (opts.method || 'GET').toUpperCase()
    if (method !== 'GET') await ensureCsrf()
    ;(opts as any).credentials = 'include'
  }

  const isForm = opts.body instanceof FormData;
  if (!isForm && opts.body && !(opts.body as any)._isRaw) {
    headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(opts.body);
  }

  let res: Response
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...opts,
      headers,
    });
  } catch (fetchErr: any) {
    throw new ApiError(`Network error: ${fetchErr.message || 'Failed to fetch'}`, 0);
  }

  const contentType = res.headers.get('content-type') || '';

  if (!res.ok) {
    if (res.status === 422 && contentType.includes('application/json')) {
      const json = await res.json();
      throw new ApiError(json.message || 'Validation failed', res.status, json.errors || json);
    }
    let text = await res.text();
    try {
      const json = JSON.parse(text);
      text = json.message || JSON.stringify(json);
    } catch {}
    throw new ApiError(text || res.statusText, res.status);
  }

  if (contentType.includes('application/json')) {
    return res.json();
  }

  // If not JSON, return as blob (cast) for downloads
  const blob = await res.blob();
  return blob as unknown as T;
}

export const api = {
  auth: {
    async register(data: {
      name: string;
      email: string;
      phone?: string;
      password: string;
      password_confirmation: string;
      role: string;
    }): Promise<{ user: User; token: string }> {
      return request('/register', { method: 'POST', body: data });
    },
    async login(data: { email: string; password: string }): Promise<{ user: User; token: string }> {
      return request('/login', { method: 'POST', body: data });
    },
    async logout(): Promise<void> {
      return request('/logout', { method: 'POST' });
    },
    async me(): Promise<User> {
      return request('/me', { method: 'GET' });
    },
  },

  properties: {
    async list(filters: Record<string, any> = {}): Promise<Paginated<Property>> {
      const qs = new URLSearchParams(filters as Record<string, string>).toString();
      const payload = await request<any>(`/properties${qs ? `?${qs}` : ''}`);
      const data = normalizeListResponse<Property>(payload);
      return {
        data,
        meta: {
          current_page: 1,
          last_page: 1,
          per_page: data.length,
          total: data.length,
        },
      };
    },
    async adminList(filters: Record<string, any> = {}): Promise<Paginated<Property>> {
      const qs = new URLSearchParams(filters as Record<string, string>).toString();
      const payload = await request<any>(`/admin/properties${qs ? `?${qs}` : ''}`);
      const data = normalizeListResponse<Property>(payload);
      return {
        data,
        meta: {
          current_page: 1,
          last_page: 1,
          per_page: data.length,
          total: data.length,
        },
      };
    },
    async get(id: number): Promise<Property> {
      return request(`/properties/${id}`);
    },
    async create(data: Partial<Property>): Promise<Property> {
      return request('/properties', { method: 'POST', body: data });
    },
    async update(id: number, data: Partial<Property>): Promise<Property> {
      return request(`/properties/${id}`, { method: 'PUT', body: data });
    },
    async verify(id: number): Promise<Property> {
      return request(`/admin/properties/${id}/verify`, { method: 'PATCH' });
    },
    async reject(id: number, reason: string): Promise<Property> {
      return request(`/admin/properties/${id}/reject`, {
        method: 'PATCH',
        body: { reason },
      });
    },
    async delete(id: number): Promise<void> {
      return request(`/properties/${id}`, { method: 'DELETE' });
    },
    async uploadImages(id: number, images: File[]): Promise<any> {
      const fd = new FormData();
      images.forEach((f) => fd.append('images[]', f));
      return request(`/properties/${id}/images`, { method: 'POST', body: fd });
    },
  },

  inquiries: {
    async create(data: { property_id: number; message: string }): Promise<Inquiry> {
      return request('/inquiries', { method: 'POST', body: data });
    },
    async list(): Promise<Inquiry[]> {
      return normalizeListResponse<Inquiry>(await request<any>('/inquiries'));
    },
    async respond(id: number, response: string): Promise<Inquiry> {
      return request(`/inquiries/${id}/respond`, { method: 'PATCH', body: { response } });
    },
  },

  favorites: {
    async toggle(property_id: number): Promise<Favorite> {
      return request('/favorites', { method: 'POST', body: { property_id } });
    },
    async delete(id: number): Promise<void> {
      return request(`/favorites/${id}`, { method: 'DELETE' });
    },
    async list(): Promise<Favorite[]> {
      return normalizeListResponse<Favorite>(await request<any>('/favorites'));
    },
  },

  leases: {
    async create(data: { property_id: number; tenant_id: number; start_date: string; rent_amount: number; currency: string }): Promise<Lease> {
      return request('/leases', { method: 'POST', body: data });
    },
    async list(): Promise<Lease[]> {
      return normalizeListResponse<Lease>(await request<any>('/leases'));
    },
    async update(id: number, data: Partial<Lease>): Promise<Lease> {
      return request(`/leases/${id}`, { method: 'PATCH', body: data });
    },
  },

  payments: {
    async submit(form: FormData): Promise<Payment> {
      return request('/payments', { method: 'POST', body: form });
    },
    async list(): Promise<Payment[]> {
      return normalizeListResponse<Payment>(await request<any>('/payments'));
    },
    async adminList(): Promise<any[]> {
      return normalizeListResponse<any>(await request<any>('/admin/payments'));
    },
    async approve(id: number): Promise<any> {
      return request(`/admin/payments/${id}/approve`, { method: 'PATCH' });
    },
    async reject(id: number, reason?: string): Promise<any> {
      return request(`/admin/payments/${id}/reject`, { method: 'PATCH', body: { reason } });
    },
  },

  receipts: {
    async download(id: number): Promise<Blob> {
      return request(`/receipts/${id}/download`);
    },
  },

  contracts: {
    async download(id: number): Promise<Blob> {
      return request(`/contracts/${id}/download`);
    },
  },

  reviews: {
    async create(data: { agent_id: number; rating: number; comment?: string }): Promise<Review> {
      return request('/reviews', { method: 'POST', body: data });
    },
    async listForAgent(agentId: number): Promise<Review[]> {
      return normalizeListResponse<Review>(await request<any>(`/agents/${agentId}/reviews`));
    },
  },

  settings: {
    async public(): Promise<SiteSettings> {
      return request('/settings/public');
    },
    async get(): Promise<SiteSettings> {
      return request('/superadmin/settings');
    },
    async update(form: FormData): Promise<SiteSettings> {
      return request('/superadmin/settings', { method: 'POST', body: form });
    },
  },

  superadmin: {
    async users(filters: Record<string, string> = {}): Promise<ManagedUser[]> {
      const qs = new URLSearchParams(filters).toString();
      return normalizeListResponse<ManagedUser>(await request(`/superadmin/users${qs ? `?${qs}` : ''}`));
    },
    async updateUserRole(id: number, role: 'admin' | 'user'): Promise<ManagedUser> {
      return request(`/superadmin/users/${id}/role`, { method: 'PATCH', body: { role } });
    },
    async deactivateUser(id: number): Promise<ManagedUser> {
      return request(`/superadmin/users/${id}/deactivate`, { method: 'PATCH' });
    },
  },
};

export default api;

// Convenience named exports for simple templates
export async function login(email: string, password: string) {
  return api.auth.login({ email, password });
}

export async function register(data: any) {
  return api.auth.register(data);
}

