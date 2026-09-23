// types/auth.ts

export type UserRole = 'super_admin' | 'owner' | 'staff' | 'tenant';
export type UserStatus = 'active' | 'inactive' | 'pending';

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  status: UserStatus;
  owner_id?: number | null;
  google_id?: string | null;
  id_card_number?: string | null;
  profile_picture?: string | null;
  created_at?: string;
  updated_at?: string;
  // Owner-specific (loaded via loadCount)
  properties_count?: number;
  staff_count?: number;
  // Tenant-specific (loaded via loadMissing)
  tenant_profile?: TenantProfile | null;
  // Staff-specific
  owner?: Pick<User, 'id' | 'name' | 'email'>;
  // Landlord Payment Methods
  bank_name?: string | null;
  bank_account_name?: string | null;
  bank_account_number?: string | null;
  bank_qr_code?: string | null;
  payment_instructions?: string | null;
  // RBAC Permissions
  permissions?: string[];
}

export interface TenantProfile {
  id: number;
  user_id: number;
  emergency_contact?: string | null;
  occupation?: string | null;
  created_at?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: 'tenant' | 'owner';
  phone?: string;
  id_card_number?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface MeResponse {
  user: User;
}
