export interface User {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  address?: string;
  role: 'customer' | 'admin';
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  phone: string;
  address?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface Order {
  id: string;
  user_id: string;
  service_type: 'wash_and_fold' | 'dry_clean' | 'ironing' | 'premium_care';
  quantity: number;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'picked_up' | 'washing' | 'ready' | 'delivered' | 'cancelled';
  pickup_address: string;
  delivery_address: string;
  scheduled_pickup: string;
  scheduled_delivery: string;
  special_instructions?: string;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  order_id: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_method: 'card' | 'upi' | 'cash';
  stripe_payment_intent_id?: string;
  transaction_id?: string;
  created_at: string;
}

export interface DecodedToken {
  userId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export interface RequestWithUser extends Express.Request {
  user?: User;
}