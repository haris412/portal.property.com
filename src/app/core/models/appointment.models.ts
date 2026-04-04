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
  /** When viewer is agent; falls back to `phone` if omitted */
  clientPhone?: string;
  agent?: string;
  /** When viewer is user; falls back to `phone` if omitted */
  agentPhone?: string;
  role: string;
  phone: string;
  time: string;
  status: AppointmentStatus;
  isRescheduled?: boolean;
}