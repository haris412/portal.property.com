export const ROLE_NAME_VALUES = [
  'Admin',
  'Buyer',
  'Seller',
  'Agent',
  'Primary Agency Admin',
] as const;

export type RoleName = (typeof ROLE_NAME_VALUES)[number];

/** Backend role name `Admin` — subscription plan picker does not apply. */
export function isAdminRole(role: string | undefined | null): boolean {
  const r = role?.trim();
  if (!r) {
    return false;
  }
  return r.toLowerCase() === 'admin';
}

/** Backend role name `Buyer` — subscription plan picker does not apply. */
export function isBuyerRole(role: string | undefined | null): boolean {
  const r = role?.trim();
  if (!r) {
    return false;
  }
  return r.toLowerCase() === 'buyer';
}

/** Users with Admin and/or Buyer never see the subscription plan picker. */
export function isSubscriptionPlansGateExcluded(roles: string[] | undefined | null): boolean {
  const list = (roles ?? []).map((r) => r.trim()).filter(Boolean);
  return list.some((r) => isAdminRole(r) || isBuyerRole(r));
}

function normalizeRoleKey(role: string): string {
  return role.trim().toLowerCase().replace(/[\s_-]+/g, '');
}

export function isPrimaryAgencyAdminRole(role: string | undefined | null): boolean {
  const r = role?.trim();
  if (!r) {
    return false;
  }
  return normalizeRoleKey(r) === 'primaryagencyadmin';
}

export function hasPrimaryAgencyAdminRole(roles: string[] | undefined | null): boolean {
  return (roles ?? []).some((r) => isPrimaryAgencyAdminRole(r));
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