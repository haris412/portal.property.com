export type AppointmentStatus =
  | 'confirmed'
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'rejected'
  | 'cancelled'
  | 'rescheduled';

export type AppointmentViewerRole = 'agent' | 'user';

export interface AppointmentApiRole {
  _id?: string;
  name?: string;
}

export interface AppointmentApiUser {
  _id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  role?: AppointmentApiRole;
}

export interface AppointmentApiProperty {
  _id?: string;
  listingTitle?: string;
  fullAddress?: string;
  neighborhood?: string;
  city?: string;
  price?: number;
  propertyType?: string;
  purpose?: string;
  status?: string;
}

/**
 * List row derived from `GET /api/appointments/user/:userId` items.
 * Top-level API fields are mapped explicitly; nested `userId` / `propertyId` are flattened for UI.
 */
export interface AppointmentListItem {
  /** API `_id` */
  id: string;
  /** From `propertyId.listingTitle` / `fullAddress` */
  property: string;
  /** From `propertyId.neighborhood` / `city` */
  area: string;
  /** Formatted from `date` (+ optional `time`) */
  date: string;
  /** API `appointmentType` */
  type: string;
  /** API `clientName` or derived from `userId` */
  clientName?: string;
  /** API `clientEmail` */
  clientEmail?: string;
  /** API `clientPhoneNumber` */
  clientPhoneNumber?: string;
  /** Assigned agent display name from API `agentName` */
  agentName?: string;
  /** Assigned agent user id from API `userId._id` */
  assignedUserId?: string;
  /** Listing owner from `propertyId.userId` */
  agent?: string;
  agentPhone?: string;
  /** API `propertyId._id` */
  listingPropertyId?: string;
  /** Raw nested objects from API (when populated) */
  user?: AppointmentApiUser;
  propertyObj?: AppointmentApiProperty;
  /** From top-level `userId.role` */
  role: string;
  /** Fallback phone for display */
  phone: string;
  /** Formatted from `time` (+ `date`) */
  time: string;
  /**
   * Start of the scheduled slot in local time (ms since epoch), derived from API `date` + `time`.
   * Used to block confirming appointments whose slot has already started.
   */
  scheduledStartMs?: number;
  /** Appointment status (not listing `propertyId.status`) */
  status: AppointmentStatus;
  /** Full URL to join the video call room (saved when status is confirmed). */
  appointmentLink?: string;
  isRescheduled?: boolean;
  /** API `createdAt` */
  createdAt?: string;
  /** API `updatedAt` */
  updatedAt?: string;
}
