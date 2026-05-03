import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ESelectEntity } from '../enums/select-entity.enum';
import { KeyValueItem, SelectItemsResponse } from '../models/common.model';
import { HttpService } from './http.service';

// Single-responsibility service for all dropdown/select data.
// Hits one backend endpoint — GET /api/common/select/:entity —
// and the backend decides which list to return based on the entity value.
@Injectable({ providedIn: 'root' })
export class CommonService {
  private readonly http = inject(HttpService);

  private readonly baseUrl = `${environment.apiUrl}/api/common`;

  // Returns a flat list of { key, value } items for the given entity.
  // id        → parent filter, e.g. pass a property type name to get its subtypes.
  // searchTerm → optional keyword filter for server-side search.
  querySelectItems(entity: ESelectEntity, id = '', searchTerm = ''): Observable<KeyValueItem[]> {
    const params = new URLSearchParams();
    if (id !== '') params.append('id', id);
    if (searchTerm !== '') params.append('searchTerm', searchTerm);

    let url = `${this.baseUrl}/select/${entity}`;
    if (params.toString() !== '') url += `?${params.toString()}`;

    // HttpService.get<T> wraps the raw body as BaseResponse<T>.result.
    // So body (res.result) is SelectItemsResponse, and body.isSuccess is the
    // API-level flag — distinct from the transport-level BaseResponse.isSuccess.
    return this.http.get<SelectItemsResponse>(url).pipe(
      map(({ result: body }) => (body.isSuccess ? body.result?.items ?? [] : [])),
    );
  }
}
