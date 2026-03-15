export interface StatItem {
  value: string;
  label: string;
}

export interface FeatureItem {
  icon: string;
  title: string;
  description: string;
}

/** Option for user type; value and label match backend role (e.g. "Admin", "Buyer"). */
export interface UserTypeOption {
  value: string;
  label: string;
}

/** Maps backend roles (e.g. ["Admin", "Buyer"]) to options; use as-is for register API. */
export function rolesToUserTypeOptions(roleNames: string[]): UserTypeOption[] {
  return roleNames
    .filter((r): r is string => typeof r === 'string' && r.trim().length > 0)
    .map((r) => {
      const trimmed = r.trim();
      return { value: trimmed, label: trimmed };
    });
}

/** Fallback when roles API fails or returns empty; same format as backend. */
export function getDefaultUserTypeOptions(): UserTypeOption[] {
  return [
    { value: 'Admin', label: 'Admin' },
    { value: 'Agent', label: 'Agent' },
    { value: 'Buyer', label: 'Buyer' },
    { value: 'Seller', label: 'Seller' }
  ];
}