import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

export type IdentityStatus = 'not_submitted' | 'pending' | 'verified' | 'rejected';

export interface IdentityImages {
  cnicFrontUrl: string | null;
  cnicBackUrl: string | null;
  facePhotoUrl: string | null;
}

export interface MyIdentityVerification {
  status: IdentityStatus;
  cnicNumber: string | null;
  cnicFrontKey: string | null;
  cnicBackKey: string | null;
  facePhotoKey: string | null;
  rejectionReason: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  images: IdentityImages;
}

export interface VerificationListItem {
  userId: string;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  phoneNumber: string;
  agency: { _id: string; name: string } | null;
  status: IdentityStatus;
  submittedAt: string | null;
}

export interface VerificationDetail {
  userId: string;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  phoneNumber: string;
  agency: { _id: string; name: string } | null;
  status: IdentityStatus;
  cnicNumber: string | null;
  rejectionReason: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  reviewedBy: { _id: string; name: string | null } | null;
  images: IdentityImages;
}

export interface VerificationListResult {
  verifications: VerificationListItem[];
  total: number;
  page: number;
  totalPages: number;
}

export interface SubmitVerificationPayload {
  cnicNumber: string;
  cnicFrontKey: string;
  cnicBackKey: string;
  facePhotoKey: string;
}

interface Envelope<T> {
  data: T;
}

@Injectable({ providedIn: 'root' })
export class AgentVerificationService {
  private readonly http = inject(HttpClient);

  getMine(): Observable<MyIdentityVerification> {
    return this.http
      .get<Envelope<MyIdentityVerification>>('/agent-verification/me')
      .pipe(map((res) => res.data));
  }

  submit(payload: SubmitVerificationPayload): Observable<MyIdentityVerification> {
    return this.http
      .post<Envelope<MyIdentityVerification>>('/agent-verification', payload)
      .pipe(map((res) => res.data));
  }

  list(query: { status?: string; search?: string; page?: number; limit?: number }): Observable<VerificationListResult> {
    let params = new HttpParams();
    if (query.status) params = params.set('status', query.status);
    if (query.search) params = params.set('search', query.search);
    if (query.page) params = params.set('page', String(query.page));
    if (query.limit) params = params.set('limit', String(query.limit));
    return this.http
      .get<Envelope<VerificationListResult>>('/admin/verifications', { params })
      .pipe(map((res) => res.data));
  }

  getByUserId(userId: string): Observable<VerificationDetail> {
    return this.http
      .get<Envelope<VerificationDetail>>(`/admin/verifications/${encodeURIComponent(userId)}`)
      .pipe(map((res) => res.data));
  }

  review(userId: string, decision: 'verified' | 'rejected', rejectionReason?: string): Observable<void> {
    return this.http
      .patch<Envelope<unknown>>(`/admin/verifications/${encodeURIComponent(userId)}/review`, {
        decision,
        rejectionReason,
      })
      .pipe(map(() => undefined));
  }
}
