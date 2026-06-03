import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type {
  Subscription,
  SubscriptionCreateDTO,
  SubscriptionCreatedEnvelope,
  SubscriptionData,
  SuccessResponseModel,
} from '../models/subscription.models';
import { ResponseModel } from '../models/response.model';

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export function extractSubscriptionFromResponse(body: ResponseModel<SubscriptionData>): Subscription | null {
  if (body.success && body.data.subscription) {
    return body.data.subscription;
  }
  return null;
}
export function extractSubscriptionFromSuccessResponse(body: SuccessResponseModel<SubscriptionCreatedEnvelope>): Subscription | null {
  if (body.success && body.data.subscription) {
    return body.data.subscription;
  }
  return null;
}

export function responseIndicatesExistingSubscription(body: ResponseModel<SubscriptionData>): boolean {
  if (body.success && body.data.subscription) {
    return true;
  }
  return false;
}

@Injectable({ providedIn: 'root' })
export class SubscriptionsApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/subscriptions`;

  getSubscriptionsForUser(userId: string, agencyId?: string | null): Observable<ResponseModel<SubscriptionData>> {
    let params = new HttpParams().set('userId', userId);
    const aid = agencyId?.trim();
    if (aid) {
      params = params.set('agencyId', aid);
    }
    return this.http.get<ResponseModel<SubscriptionData>>(this.base, { params });
  }

  createSubscription(
    body: SubscriptionCreateDTO,
  ): Observable<SuccessResponseModel<SubscriptionCreatedEnvelope>> {
    return this.http.post<SuccessResponseModel<SubscriptionCreatedEnvelope>>(this.base, body);
  }
}
