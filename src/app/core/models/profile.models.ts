export type ProfileRole = 'user' | 'agent';

export type ProfileSectionKey =
  | 'account'
  | 'security'
  | 'availability';

export interface ProfileSidebarItem {
  id: ProfileSectionKey;
  label: string;
  icon: string;
}

export interface AgentDayAvailability {
  day: string;
  enabled: boolean;
  startTime: string;
  endTime: string;
}

export interface UserProfileModel {
  id: string;
  role: ProfileRole;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  bio?: string;
  company?: string;
  title?: string;
  location?: string;
  avatarUrl?: string;
  availability?: AgentDayAvailability[];
}