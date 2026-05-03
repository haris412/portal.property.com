// Enum values match the :entity segment in GET /api/common/select/:entity.
// Backend has an if/switch on this value to decide which list to return.
export enum ESelectEntity {
  PropertyType = 'property_type',
  PropertySubtype = 'property_subtype',
  Role = 'role',
}
