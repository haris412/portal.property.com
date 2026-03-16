import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/api-response.model';
import { AddListingModel } from '../models/add-listing.model';
import { environment } from '../../../environments/environment';

export interface AddListingResponse {
  id: string | number;
}

@Injectable({ providedIn: 'root' })
export class AddListingService {
  private readonly baseUrl = `${environment.apiUrl}/api/properties`;

  constructor(private http: HttpClient) {}

  createListing(payload: AddListingModel): Observable<ApiResponse<AddListingResponse>> {
    return this.http.post<ApiResponse<AddListingResponse>>(`${this.baseUrl}`, {
      ...payload,
      status: 'Published',
    });
  }

  saveDraft(payload: AddListingModel): Observable<ApiResponse<AddListingResponse>> {
    return this.http.post<ApiResponse<AddListingResponse>>(`${this.baseUrl}`, {
      ...payload,
      status: 'Draft',
    });
  }
}

