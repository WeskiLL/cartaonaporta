// Management System Types
import { Json } from '@/integrations/supabase/types';

export interface ManagementUser {
  id: string;
  user_id: string;
  email?: string;
  role: 'admin' | 'financeiro' | 'vendedor';
  created_at: string;
}

export interface Client {
  id: string;
  name: string;
  document: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ManagementProduct {
  id: string;
  name: string;
  size: string;
  description?: string;
  base_price?: number;
  cost?: number;
  category: string;
  image_url?: string;
  is_kit?: boolean;
  kit_description?: string;
  is_active?: boolean;
  display_order?: number;
  available_quantities?: number[];
  custom_specs?: string[];
  price_qty100?: number;
  price_qty200?: number;
  price_qty250?: number;
  price_qty500?: number;
  price_qty1000?: number;
  price_qty2000?: number;
  created_at: string;
  updated_at: string;
}

export interface QuoteItem {
  id: string;
  quote_id?: string;
  order_id?: string;
  product_id?: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface Quote {
  id: string;
  number: string;
  client_id?: string;
  client_name: string;
  items?: QuoteItem[];
  subtotal: number;
  discount: number;
  total: number;
  notes?: string;
  status: 'pending' | 'approved' | 'rejected' | 'converted';
  valid_until?: string;
  created_at: string;
  updated_at: string;
}

export interface DeliveryAddress {
  zip_code: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
}

export interface Order {
  id: string;
  number: string;
  quote_id?: string;
  client_id?: string;
  client_name: string;
  items?: QuoteItem[];
  subtotal: number;
  discount: number;
  total: number;
  notes?: string;
  status: 'awaiting_payment' | 'creating_art' | 'production' | 'shipping' | 'delivered';
  delivery_address?: Json;
  revenue_added?: boolean;
  created_at: string;
  completed_at?: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  category: string;
  description: string;
  amount: number;
  date: string;
  notes?: string;
  order_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Mockup {
  id: string;
  name: string;
  category: string;
  image_url: string;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  name: string;
  cnpj: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  phone: string;
  email: string;
  website?: string;
  logo_url?: string;
  created_at: string;
  updated_at: string;
}

export type OrderStatus = Order['status'];
export type QuoteStatus = Quote['status'];
export type TransactionType = Transaction['type'];
