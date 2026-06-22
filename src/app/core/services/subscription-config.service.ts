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
  private readonly api = `${environment.apiUrl}/api`;

  getAllRoles(): Observable<ResponseModel<Role>> {
    return this.http
      .get<ResponseModel<Role>>(`${this.api}/roles`)
      .pipe(map((body) => body));
  }

  getAllSubscriptionFeatures(): Observable<ResponseModel<SubscriptionFeaturesListDto>> {
    return this.http
      .get<ResponseModel<SubscriptionFeaturesListDto>>(`${this.api}/subscriptions/features`)
      .pipe(map((body) => body));
  }

  getSubscriptionConfigByRole(roleName: string): Observable<ResponseModel<SubscriptionConfig>> {
    const role = encodeURIComponent(roleName.trim());
    return this.http
      .get<ResponseModel<SubscriptionConfig>>(`${this.api}/subscription-config/role/${role}`)
      .pipe(map((body) => body));
  }

  bulkSave(payload: SubscriptionConfigBulkPayload): Observable<unknown> {
    return this.http.post<unknown>(`${this.api}/subscription-config/bulk`, payload);
  }
}
