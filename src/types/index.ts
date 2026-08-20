export type Role = 'buyer_renter' | 'owner' | 'agent' | 'admin' | 'superadmin';

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  role: Role;
  created_at?: string;
  updated_at?: string;
}

export interface SiteSettings {
  hero_headline?: string | null;
  hero_subheadline?: string | null;
  hero_background_image_path?: string | null;
  hero_background_image_url?: string | null;
  site_notification_banner?: string | null;
  site_notification_active?: boolean;
  smtp_host_configured?: boolean;
  smtp_port_configured?: boolean;
  smtp_username_configured?: boolean;
  smtp_password_configured?: boolean;
  smtp_from_address_configured?: boolean;
  smtp_password?: string | null;
  smtp_host?: string | null;
  smtp_port?: string | number | null;
  smtp_username?: string | null;
  smtp_from_address?: string | null;
  featured_listing_enabled?: boolean;
  featured_listing_price?: string | number | null;
  featured_listing_currency?: 'RWF' | 'USD' | string | null;
  featured_listing_duration_days?: string | number | null;
}

export interface PaymentMethod {
  id: number;
  name: string;
  type: 'momo' | 'bank' | 'other';
  account_number: string;
  account_name: string;
  instructions?: string | null;
  is_active: boolean;
  display_order?: number;
}

export interface ManagedUser extends User {
  is_active?: boolean;
  last_changed_by?: User | null;
  last_changed_at?: string | null;
}

export interface PropertyImage {
  id: number;
  url: string;
  path?: string;
  is_primary?: boolean;
  created_at?: string;
  updated_at?: string;
}

export type Category = 'residential' | 'commercial' | 'land' | 'short_stay';
export type ListingType = 'sale' | 'rent' | 'short_stay';

export interface Property {
  id: number;
  title: string;
  description: string;
  category: Category;
  listing_type: ListingType;
  price: number;
  currency: string;
  province?: string | null;
  district?: string | null;
  sector?: string | null;
  cell?: string | null;
  village?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  size_sqm?: number | null;
  images: PropertyImage[];
  owner_id?: number | null;
  agent_id?: number | null;
  owner?: User | null;
  agent?: User | null;
  status?: 'pending' | 'verified' | 'rejected';
  rejection_reason?: string | null;
  possible_duplicate?: boolean;
  duplicate_of_property_id?: number | null;
  featured_until?: string | null;
  is_currently_featured?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Inquiry {
  id: number;
  property_id: number;
  sender_id: number;
  receiver_id?: number | null;
  message: string;
  property?: Property;
  response?: string | null;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Favorite {
  id: number;
  user_id: number;
  property_id: number;
  property?: Property;
  created_at?: string;
}

export type LeaseStatus = 'active' | 'ended' | 'cancelled';

export interface Lease {
  id: number;
  property_id: number;
  tenant_id: number;
  tenant?: User | null;
  tenant_name?: string | null;
  property?: Partial<Property> | null;
  start_date: string;
  rent_amount: number;
  currency: string;
  status: LeaseStatus;
  end_date?: string | null;
  payments?: Payment[];
  created_at?: string;
  updated_at?: string;
}

export type PaymentStatus = 'pending' | 'approved' | 'rejected';

export interface Payment {
  id: number;
  property_id?: number | null;
  user_id: number;
  amount: number;
  currency: string;
  purpose: 'deposit' | 'rent' | 'purchase' | 'featured_listing' | string;
  payer_name: string;
  reference_number: string;
  screenshot_url?: string | null;
  receipt_id?: number | null;
  contract_id?: number | null;
  overdue?: boolean;
  sla_deadline?: string | null;
  status?: PaymentStatus;
  created_at?: string;
  updated_at?: string;
  payment_method_id?: number | null;
  payment_method?: PaymentMethod | null;
}

export interface Receipt {
  id: number;
  payment_id: number;
  url: string;
}

export interface Contract {
  id: number;
  lease_id: number;
  url: string;
}

export interface Review {
  id: number;
  agent_id: number;
  agent?: User | null;
  user_id: number;
  user?: User | null;
  rating: number; // 1-5
  comment?: string | null;
  created_at?: string;
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}
