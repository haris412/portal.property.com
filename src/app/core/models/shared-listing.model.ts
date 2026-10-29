/**
 * Shared listing: renting out PART of a House or Flat (e.g. 1 room of a 3-room house).
 * Mirrors the backend contract for `isShared` / `sharedDetails` on a property.
 */

export const SHARED_BATHROOM_OPTIONS          = ['Shared', 'Separate', 'Attached'] as const;
export const SHARED_KITCHEN_OPTIONS           = ['Shared', 'Separate', 'Not Available'] as const;
export const SHARED_LIVING_ROOM_OPTIONS       = ['Shared', 'Not Available'] as const;
export const SHARED_LAUNDRY_OPTIONS           = ['Shared', 'Separate', 'Not Available'] as const;
export const SHARED_ENTRANCE_OPTIONS          = ['Shared', 'Separate'] as const;
export const SHARED_TENANT_PREFERENCE_OPTIONS = ['Any', 'Male', 'Female', 'Family', 'Students', 'Working Professionals'] as const;

export type SharedBathroom         = (typeof SHARED_BATHROOM_OPTIONS)[number];
export type SharedKitchen          = (typeof SHARED_KITCHEN_OPTIONS)[number];
export type SharedLivingRoom       = (typeof SHARED_LIVING_ROOM_OPTIONS)[number];
export type SharedLaundry          = (typeof SHARED_LAUNDRY_OPTIONS)[number];
export type SharedEntrance         = (typeof SHARED_ENTRANCE_OPTIONS)[number];
export type SharedTenantPreference = (typeof SHARED_TENANT_PREFERENCE_OPTIONS)[number];

export interface SharedDetails {
  roomsAvailable:     number;
  bathroom:           SharedBathroom;
  kitchen:            SharedKitchen;
  livingRoom?:        SharedLivingRoom;
  laundry?:           SharedLaundry;
  entrance?:          SharedEntrance;
  currentOccupants?:  number;
  tenantPreference?:  SharedTenantPreference;
  utilitiesIncluded?: boolean;
}

/** Subtype slugs (from GET /api/property-catalog) that may be listed as shared. Never match by name or id. */
export const SHAREABLE_SUBTYPE_SLUGS: readonly string[] = ['house', 'flat'];

/** Backend `purpose` value that allows shared listings. */
export const SHAREABLE_PURPOSE = 'For Rent';

export function isShareableSubtypeSlug(slug: string | null | undefined): boolean {
  return SHAREABLE_SUBTYPE_SLUGS.includes((slug ?? '').trim().toLowerCase());
}

/** Older properties may omit the fields entirely; treat missing as not shared. */
export function isSharedProperty(doc: { isShared?: boolean | null; sharedDetails?: SharedDetails | null } | null | undefined): boolean {
  return doc?.isShared === true && doc.sharedDetails != null;
}

/** "Shared · 1 room" / "Shared · 2 rooms" (or just "Shared" when the count is unknown). */
export function formatSharedBadgeLabel(details: SharedDetails | null | undefined): string {
  const rooms = details?.roomsAvailable;
  if (rooms == null || !Number.isFinite(rooms)) return 'Shared';
  return `Shared · ${rooms} ${rooms === 1 ? 'room' : 'rooms'}`;
}

export interface SharedDetailLine { label: string; value: string; }

/** Readable label/value pairs for each filled field; empty optional fields are skipped. */
export function formatSharedDetailLines(details: SharedDetails | null | undefined): SharedDetailLine[] {
  if (!details) return [];
  const lines: SharedDetailLine[] = [];
  const push = (label: string, value: string | null | undefined) => {
    if (value != null && value !== '') lines.push({ label, value });
  };

  push('Rooms available',    details.roomsAvailable != null ? String(details.roomsAvailable) : null);
  push('Bathroom',           details.bathroom === 'Attached' ? 'Attached (private)' : details.bathroom);
  push('Kitchen',            details.kitchen);
  push('Living room',        details.livingRoom);
  push('Laundry',            details.laundry);
  push('Entrance',           details.entrance);
  push('Current occupants',  details.currentOccupants != null ? String(details.currentOccupants) : null);
  push('Preferred tenants',  details.tenantPreference);
  push('Utilities included', details.utilitiesIncluded == null ? null : details.utilitiesIncluded ? 'Yes' : 'No');
  return lines;
}
