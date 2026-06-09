export type { RoleName } from './role.models';
export { ROLE_NAME_VALUES } from './role.models';

export const SUBSCRIPTION_TYPE_VALUES = ['Free', 'Monthly', 'Annual'] as const;
export type SubscriptionType = (typeof SUBSCRIPTION_TYPE_VALUES)[number];

export interface Subscription {
  _id?: string;
  userId: string;
  agencyId: string | null;
  subscriptionType: SubscriptionType;
  numberOfFeatureListing: number;
  numberOfAgentVisibility: number;
  subscriptionDate: string;
  subscriptionResetDate: string | null;
  subscriptionExpiryDate: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface SubscriptionCreateDTO {
  userId: string;
  agencyId: string | null;
  subscriptionType: SubscriptionType;
  numberOfFeatureListing: number;
  numberOfAgentVisibility: number;
  subscriptionDate: string;
}

/** PUT `/api/subscriptions/updateSubscription` — partial subscription update (e.g. quota decrement). */
export interface SubscriptionUpdateDTO {
  _id: string;
  numberOfFeatureListing: number;
}

export interface SuccessResponseModel<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface SubscriptionCreatedEnvelope {
  subscription: Subscription;
}

export interface SubscriptionFeatures {
  _id: string;
  description: string;
  isPaid: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SubscriptionFeaturesListDto {
  subscriptionFeatures: SubscriptionFeatures[];
}

export type SubscriptionFeatureList = SubscriptionFeatures;

export interface SubscriptionConfig {
  subscriptionConfigs: SubscriptionConfigListDto[];
}

export interface SubscriptionConfigListDto {
  _id?: string;
  role: string;
  featureId: string;
  feature?: SubscriptionFeatures | null;
  monthlyPrice: number;
  annualPrice: number;
  featureValue: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface SubscriptionConfigBulkItem {
  _id?: string;
  role: string;
  featureId: string;
  monthlyPrice: number;
  annualPrice: number;
  featureValue: number;
}

export interface SubscriptionConfigBulkPayload {
  subscriptionConfigs: SubscriptionConfigBulkItem[];
}

export interface SubscriptionData {
  subscription: Subscription;
}