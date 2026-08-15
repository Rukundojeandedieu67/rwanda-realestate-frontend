export type Role = 'buyer_renter' | 'owner' | 'agent' | 'admin';

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  role: Role;
  created_at?: string;
  updated_at?: string;
}

export interface PropertyImage {
  id: number;
  url: string;
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
  created_at?: string;
  updated_at?: string;
}

export interface Inquiry {
  id: number;
  property_id: number;
  sender_id: number;
  receiver_id?: number | null;
  message: string;
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
  purpose: 'deposit' | 'rent' | 'purchase' | string;
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
