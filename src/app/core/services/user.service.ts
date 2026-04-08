import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { fromApiUser, User } from './auth.service';

export interface UpdateUserPayload {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  location?: string;
}

interface UpdateUserApiResponse {
  success?: boolean;
  message?: string;
  data?: { user?: Record<string, unknown> };
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/users`;

  updateUser(id: string, payload: UpdateUserPayload): Observable<User> {
    return this.http
      .put<UpdateUserApiResponse>(`${this.baseUrl}/${encodeURIComponent(id)}`, payload)
      .pipe(
        map((res) => {
          if (res.success === false) {
            throw new Error(res.message ?? 'Could not update profile');
          }
          const raw = res.data?.user;
          if (!raw) throw new Error('Invalid response from server');
          return fromApiUser(raw);
        }),
        catchError((err) => throwError(() => err))
      );
  }
}
