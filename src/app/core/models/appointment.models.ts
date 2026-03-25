export type AppointmentStatus =
  | 'confirmed'
  | 'pending'
  | 'completed'
  | 'cancelled'
  | 'rescheduled';

export type AppointmentViewerRole = 'agent' | 'user';

export interface AppointmentListItem {
  id: string;
  property: string;
  area: string;
  date: string;
  type: string;
  client?: string;
  agent?: string;
  role: string;
  phone: string;
  time: string;
  status: AppointmentStatus;
  isRescheduled?: boolean;
}