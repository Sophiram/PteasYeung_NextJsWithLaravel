// types/user.ts
export type { User, UserRole, UserStatus, TenantProfile } from './auth';

export interface AdminUserListResponse {
  data?: import('./auth').User[];
  success?: boolean;
}

export interface UpdateUserStatusRequest {
  status: import('./auth').UserStatus;
}

export interface UpdateUserRoleRequest {
  role: import('./auth').UserRole;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role: import('./auth').UserRole;
  phone?: string;
  id_card_number?: string;
}
