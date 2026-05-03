export type AlertPurpose = 'For Sale' | 'For Rent' | 'Any';

export interface PropertyAlert {
  _id: string;
  purpose?: AlertPurpose | null;
  city?: string | null;
  neighborhood?: string | null;
  propertyType?: string | null;
  subtype?: string | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  minBedrooms?: number | null;
  isActive: boolean;
  createdAt?: string;
}

export type CreateAlertPayload = Omit<PropertyAlert, '_id' | 'createdAt'>;
export type UpdateAlertPayload = Partial<CreateAlertPayload>;
