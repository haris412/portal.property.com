import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type {
  Subscription,
  SubscriptionCreateDTO,
  SubscriptionCreatedEnvelope,
  SubscriptionUpdateDTO,
  SubscriptionType,
  SuccessResponseModel,
} from '../interfaces/subscription.models';
import { SUBSCRIPTION_TYPE_VALUES } from '../interfaces/subscription.models';

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function readObjectId(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim();
  }
  if (isRecord(value) && value['_id'] != null) {
    return String(value['_id']).trim();
  }
  if (value != null) {
    return String(value).trim();
  }
  return '';
}

function pickSubscriptionType(value: unknown): SubscriptionType | null {
  return typeof value === 'string' && (SUBSCRIPTION_TYPE_VALUES as readonly string[]).includes(value)
    ? (value as SubscriptionType)
    : null;
}

/** Normalizes a subscription document from API JSON (GET/POST/PUT). */
export function normalizeSubscriptionRecord(raw: unknown): Subscription | null {
  if (!isRecord(raw)) {
    return null;
  }

  const userId = readObjectId(raw['userId']);
  if (!userId) {
    return null;
  }

  const subscriptionType = pickSubscriptionType(raw['subscriptionType']);
  if (!subscriptionType) {
    return null;
  }

  let agencyId: string | null = null;
  const agencyRaw = raw['agencyId'];
  if (agencyRaw != null && agencyRaw !== '') {
    const id = readObjectId(agencyRaw);
    agencyId = id || null;
  }

  const out: Subscription = {
    userId,
    agencyId,
    subscriptionType,
    numberOfFeatureListing: Math.max(0, Math.floor(Number(raw['numberOfFeatureListing'])) || 0),
    numberOfAgentVisibility: Math.max(0, Math.floor(Number(raw['numberOfAgentVisibility'])) || 0),
    subscriptionDate:
      typeof raw['subscriptionDate'] === 'string' && raw['subscriptionDate'].trim()
        ? raw['subscriptionDate'].trim()
        : new Date().toISOString(),
    subscriptionResetDate:
      raw['subscriptionResetDate'] == null || raw['subscriptionResetDate'] === ''
        ? null
        : String(raw['subscriptionResetDate']),
    subscriptionExpiryDate:
      raw['subscriptionExpiryDate'] == null || raw['subscriptionExpiryDate'] === ''
        ? null
        : String(raw['subscriptionExpiryDate']),
  };

  const id = readObjectId(raw['_id']);
  if (id) {
    out._id = id;
  }
  if (typeof raw['createdAt'] === 'string') {
    out.createdAt = raw['createdAt'];
  }
  if (typeof raw['updatedAt'] === 'string') {
    out.updatedAt = raw['updatedAt'];
  }

  return out;
}

function firstSubscriptionCandidate(payload: unknown): unknown {
  if (payload == null) {
    return null;
  }
  if (Array.isArray(payload)) {
    return payload[0] ?? null;
  }
  if (!isRecord(payload)) {
    return null;
  }

  if (isRecord(payload['subscription'])) {
    return payload['subscription'];
  }

  for (const key of ['subscriptions', 'items', 'results'] as const) {
    const arr = payload[key];
    if (Array.isArray(arr) && arr.length > 0) {
      return arr[0];
    }
  }

  if (payload['userId'] != null && payload['subscriptionType'] != null) {
    return payload;
  }

  return null;
}

/**
 * Reads subscription from typical API envelopes:
 * `{ success, data: { subscription } }`, `{ data: { subscriptions: [...] } }`, etc.
 */
export function extractSubscriptionFromResponse(body: unknown): Subscription | null {
  if (!isRecord(body) || body['success'] === false) {
    return null;
  }

  const fromData = firstSubscriptionCandidate(body['data']);
  if (fromData) {
    return normalizeSubscriptionRecord(fromData);
  }

  const fromRoot = firstSubscriptionCandidate(body);
  if (fromRoot && fromRoot !== body['data']) {
    return normalizeSubscriptionRecord(fromRoot);
  }

  return null;
}

export function extractSubscriptionFromSuccessResponse(
  body: SuccessResponseModel<SubscriptionCreatedEnvelope>,
): Subscription | null {
  return extractSubscriptionFromResponse(body);
}

export function responseIndicatesExistingSubscription(body: unknown): boolean {
  return extractSubscriptionFromResponse(body) != null;
}

@Injectable({ providedIn: 'root' })
export class SubscriptionsApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `/subscriptions`;

  getSubscriptionsForUser(userId: string, agencyId?: string | null): Observable<unknown> {
    let params = new HttpParams().set('userId', userId);
    const aid = agencyId?.trim();
    if (aid) {
      params = params.set('agencyId', aid);
    }
    return this.http.get<unknown>(this.base, { params });
  }

  createSubscription(
    body: SubscriptionCreateDTO,
  ): Observable<SuccessResponseModel<SubscriptionCreatedEnvelope>> {
    return this.http.post<SuccessResponseModel<SubscriptionCreatedEnvelope>>(this.base, body);
  }

  updateSubscription(
    body: SubscriptionUpdateDTO,
  ): Observable<SuccessResponseModel<SubscriptionCreatedEnvelope>> {
    return this.http.put<SuccessResponseModel<SubscriptionCreatedEnvelope>>(
      `${this.base}/updateSubscription`,
      body,
    );
  }

  checkActiveSubscriptionAndFeaturedCount(
    userId:string,
  ) {
    return this.http.get<any>(
      `${this.base}/${userId}/status`
    ).toPromise();
  }
}
