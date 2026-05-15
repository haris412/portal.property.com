export interface StatItem {
  value: string;
  label: string;
}

export interface FeatureItem {
  icon: string;
  title: string;
  description: string;
}

export interface SignupPrefill {
  email?: string;
  /** Full name or first name from URL — component splits on first space. */
  firstName?: string;
  /** Raw international phone e.g. "+923001234567" — component parses country + local. */
  rawPhone?: string;
  roleName?: string;
}

/** Option for user type; value and label match backend role (e.g. "Admin", "Buyer"). */
export interface UserTypeOption {
  value: string;
  label: string;
}

const SIGNUP_EXCLUDED_ROLES = new Set(['Admin', 'Buyer', 'PrimaryAgencyAdmin']);

/** Maps backend roles to signup options, excluding roles not available for self-registration. */
export function rolesToUserTypeOptions(roleNames: string[]): UserTypeOption[] {
  return roleNames
    .filter((r): r is string => typeof r === 'string' && r.trim().length > 0)
    .filter((r) => !SIGNUP_EXCLUDED_ROLES.has(r.trim()))
    .map((r) => {
      const trimmed = r.trim();
      return { value: trimmed, label: trimmed };
    });
}

/** Fallback when roles API fails or returns empty. */
export function getDefaultUserTypeOptions(): UserTypeOption[] {
  return [
    { value: 'Agent', label: 'Agent' },
    { value: 'Seller', label: 'Seller' }
  ];
}