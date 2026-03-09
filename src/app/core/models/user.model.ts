export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
  isActive: boolean;
}

export type UserRole = 'admin' | 'manager' | 'viewer';

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}
