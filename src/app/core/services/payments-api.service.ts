import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import type { SubscriptionType, SuccessResponseModel } from '../interfaces/subscription.models';

export type PaidSubscriptionType = Extract<SubscriptionType, 'Monthly' | 'Annual'>;

export type CheckoutMethodId = 'card' | 'jazzcash' | 'easypaisa';

export type PaymentStatus = 'Pending' | 'Paid' | 'Failed' | 'Cancelled';

export interface PaymentRecord {
  _id: string;
  userId: string;
  agencyId: string | null;
  subscriptionType: PaidSubscriptionType;
  amount: number;
  currency: string;
  numberOfFeatureListing: number;
  numberOfAgentVisibility: number;
  method?: CheckoutMethodId;
  provider: string;
  providerSessionId: string;
  status: PaymentStatus;
  paidAt: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CheckoutMethod {
  id: CheckoutMethodId;
  label: string;
  provider: 'stripe' | 'paymob';
  enabled: boolean;
}

export interface CheckoutRequest {
  subscriptionType: PaidSubscriptionType;
  method?: CheckoutMethodId;
}

export interface CheckoutEnvelope {
  checkoutUrl: string;
  payment: PaymentRecord;
}

export interface PaymentEnvelope {
  payment: PaymentRecord;
}

export interface CheckoutMethodsEnvelope {
  methods: CheckoutMethod[];
}

@Injectable({ providedIn: 'root' })
export class PaymentsApiService {
  private readonly http = inject(HttpClient);
  private readonly base = '/payments';

  createCheckout(body: CheckoutRequest): Observable<SuccessResponseModel<CheckoutEnvelope>> {
    return this.http.post<SuccessResponseModel<CheckoutEnvelope>>(`${this.base}/checkout`, body);
  }

  getCheckoutMethods(): Observable<SuccessResponseModel<CheckoutMethodsEnvelope>> {
    return this.http.get<SuccessResponseModel<CheckoutMethodsEnvelope>>(`${this.base}/methods`);
  }

  getPaymentBySession(sessionId: string): Observable<SuccessResponseModel<PaymentEnvelope>> {
    return this.http.get<SuccessResponseModel<PaymentEnvelope>>(
      `${this.base}/session/${encodeURIComponent(sessionId)}`,
    );
  }

  getPaymentById(id: string): Observable<SuccessResponseModel<PaymentEnvelope>> {
    return this.http.get<SuccessResponseModel<PaymentEnvelope>>(`${this.base}/${encodeURIComponent(id)}`);
  }
}
