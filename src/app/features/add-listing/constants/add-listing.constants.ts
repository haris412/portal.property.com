export const PROPERTY_MEDIA_BLOCK_IDS = {
  PHOTOS: 'photos',
  VIDEO: 'video'
} as const;

export type PropertyMediaBlockId =
  (typeof PROPERTY_MEDIA_BLOCK_IDS)[keyof typeof PROPERTY_MEDIA_BLOCK_IDS];

export const ADD_LISTING_HEADER_ACTIONS = {
  SAVE_DRAFT: 'save-draft',
  PUBLISH_LISTING: 'publish-listing',
} as const;
