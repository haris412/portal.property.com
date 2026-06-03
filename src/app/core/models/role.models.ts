export const ROLE_NAME_VALUES = [
  'Admin',
  'Buyer',
  'Seller',
  'Agent',
  'Primary Agency Admin',
] as const;

export type RoleName = (typeof ROLE_NAME_VALUES)[number];

/** Backend role name `Admin` — subscription marketing popup does not apply. */
export function isAdminRole(role: string | undefined | null): boolean {
  const r = role?.trim();
  if (!r) {
    return false;
  }
  return r.toLowerCase() === 'admin';
}

export interface RoleListItem {
  _id?: string;
  name: RoleName | string;
  description?: string;
  permissions: string[];
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Role {
  roles: RoleListItem[];
}