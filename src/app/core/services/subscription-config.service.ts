import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { type Role } from '../models/role.models';
import type {
  SubscriptionConfig,
  SubscriptionConfigBulkPayload,
  SubscriptionFeaturesListDto,
} from '../interfaces/subscription.models';
import { ResponseModel } from '../models/response.model';

@Injectable({ providedIn: 'root' })
export class SubscriptionConfigService {
  private readonly http = inject(HttpClient);

  getAllRoles(): Observable<ResponseModel<Role>> {
    return this.http
      .get<ResponseModel<Role>>(`/roles`)
      .pipe(map((body) => body));
  }

  getAllSubscriptionFeatures(): Observable<ResponseModel<SubscriptionFeaturesListDto>> {
    return this.http
      .get<ResponseModel<SubscriptionFeaturesListDto>>(`/subscriptions/features`)
      .pipe(map((body) => body));
  }

  getSubscriptionConfigByRole(roleName: string): Observable<ResponseModel<SubscriptionConfig>> {
    const role = encodeURIComponent(roleName.trim());
    return this.http
      .get<ResponseModel<SubscriptionConfig>>(`/subscription-config/role/${role}`)
      .pipe(map((body) => body));
  }

  bulkSave(payload: SubscriptionConfigBulkPayload): Observable<unknown> {
    return this.http.post<unknown>(`/subscription-config/bulk`, payload);
  }
}
