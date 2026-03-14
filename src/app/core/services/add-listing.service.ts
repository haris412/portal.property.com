import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/api-response.model';
import { AddListingModel } from '../models/add-listing.model';

export interface AddListingResponse {
  id: string | number;
}

@Injectable({ providedIn: 'root' })
export class AddListingService {
  private readonly baseUrl = 'http://localhost:3000/api/properties';
  private readonly TEST_TOKEN =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OWI0MTZmNGFiYzVjNGJmMjYwMDBmNDMiLCJlbWFpbCI6ImphbWVlbGhhc2liMDQ5QGdtYWlsLmNvbSIsImlhdCI6MTc3MzQxMDA0MCwiZXhwIjoxNzczNjY5MjQwfQ.oh2Wg14UUFqB-pnyDmX6CuiQntS62s1Csoj-8jYoHjA';

  constructor(private http: HttpClient) {}

  createListing(payload: AddListingModel): Observable<ApiResponse<AddListingResponse>> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.TEST_TOKEN}`,
    });

    return this.http.post<ApiResponse<AddListingResponse>>(`${this.baseUrl}`, payload, {
      headers,
    });
  }

  saveDraft(payload: AddListingModel): Observable<ApiResponse<AddListingResponse>> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.TEST_TOKEN}`,
    });

    return this.http.post<ApiResponse<AddListingResponse>>(`${this.baseUrl}/drafts`, payload, {
      headers,
    });
  }
}

