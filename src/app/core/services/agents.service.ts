import { HttpClient, HttpParams } from '@angular/common/http';
import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import type {
  AgentListItem,
  AgentsListResult,
  CreateAgentDTO,
  DeactivateAgentDTO,
  UpdateAgentDTO,
} from '../models/agent.models';

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function normalizeAgentRow(raw: unknown): AgentListItem | null {
  if (!isRecord(raw)) {
    return null;
  }
  const id = raw['_id'] ?? raw['id'];
  if (id == null) {
    return null;
  }

  const roleRaw = raw['role'];
  const role =
    typeof roleRaw === 'object' && roleRaw != null && 'name' in roleRaw
      ? { name: String((roleRaw as { name: unknown }).name ?? '') }
      : typeof roleRaw === 'string'
        ? { name: roleRaw }
        : undefined;

  return {
    _id: String(id),
    firstName: String(raw['firstName'] ?? '').trim(),
    lastName: String(raw['lastName'] ?? '').trim(),
    email: String(raw['email'] ?? '').trim(),
    phoneNumber: (raw['phoneNumber'] as string | undefined)?.trim() || undefined,
    displayName: (raw['displayName'] as string | undefined)?.trim() || undefined,
    profileImageUrl: (raw['profileImageUrl'] as string | undefined)?.trim() || undefined,
    location: (raw['location'] as string | undefined)?.trim() || undefined,
    isFeaturedAgent:
      raw['isFeaturedAgent'] === true ||
      raw['isFeaturedAgent'] === 'true' ||
      raw['isFeatured'] === true ||
      raw['isFeatured'] === 'true',
    isActive: raw['isActive'] === true || raw['isActive'] === 'true',
    isEmailVerified: raw['isEmailVerified'] === true,
    inviteStatus: (raw['inviteStatus'] as string | undefined) ?? undefined,
    role,
    createdAt: (raw['createdAt'] as string | undefined) ?? undefined,
  };
}

function normalizeAgentsList(body: unknown): AgentsListResult {
  if (!isRecord(body)) {
    return { agents: [] };
  }

  const data = body['data'];
  let rows: unknown[] = [];

  if (Array.isArray(data)) {
    rows = data;
  } else if (isRecord(data)) {
    const agents = data['agents'];
    if (Array.isArray(agents)) {
      rows = agents;
    } else if (data['agent'] != null) {
      rows = [data['agent']];
    }
  } else if (Array.isArray(body['agents'])) {
    rows = body['agents'] as unknown[];
  }

  const agents = rows
    .map((row) => normalizeAgentRow(row))
    .filter((row): row is AgentListItem => row != null);

  const total =
    (isRecord(data) && typeof data['total'] === 'number' ? data['total'] : undefined) ??
    (typeof body['total'] === 'number' ? body['total'] : undefined) ??
    agents.length;

  return { agents, total };
}

@Injectable({ providedIn: 'root' })
export class AgentsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `/agents`;

  getAgentsByAgency(agencyId: string): Observable<AgentsListResult> {
    const params = new HttpParams().set('agencyId', agencyId.trim());
    return this.http.get<unknown>(this.baseUrl, { params }).pipe(map((body) => normalizeAgentsList(body)));
  }

  getAgentById(agentId: string, agencyId?: string): Observable<AgentListItem> {
    const encodedId = encodeURIComponent(agentId.trim());
    return this.http.get<unknown>(`${this.baseUrl}/${encodedId}`).pipe(
      map((body) => this.extractAgentFromResponse(body)),
      catchError((err: unknown) => {
        if (!(err instanceof HttpErrorResponse) || err.status !== 404 || !agencyId?.trim()) {
          return throwError(() => err);
        }
        return this.getAgentsByAgency(agencyId).pipe(
          map((result) => {
            const agent = result.agents.find((row) => row._id === agentId);
            if (!agent) {
              throw err;
            }
            return agent;
          }),
        );
      }),
    );
  }

  createAgent(payload: CreateAgentDTO): Observable<AgentListItem> {
    return this.http.post<unknown>(this.baseUrl, payload).pipe(
      map((body) => this.extractAgentFromResponse(body)),
    );
  }

  updateAgent(payload: UpdateAgentDTO): Observable<AgentListItem> {
    return this.http
      .put<unknown>(`${this.baseUrl}/updateAgent`, payload)
      .pipe(map((body) => this.extractAgentFromResponse(body)));
  }

  deactivateAgent(payload: DeactivateAgentDTO): Observable<AgentListItem> {
    return this.http
      .patch<unknown>(`${this.baseUrl}/deactivate`, payload)
      .pipe(map((body) => this.extractAgentFromResponse(body)));
  }

  private extractAgentFromResponse(body: unknown): AgentListItem {
    if (isRecord(body) && isRecord(body['data'])) {
      const nested = body['data']['agent'] ?? body['data']['user'] ?? body['data'];
      const agent = normalizeAgentRow(nested);
      if (agent) {
        return agent;
      }
    }
    const direct = normalizeAgentRow(body);
    if (direct) {
      return direct;
    }
    throw new Error('Invalid agent response from server.');
  }
}
