import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../../../../environments/environment";
import { CreateConversationDto } from "../models/createConversation.model";

@Injectable({
  providedIn: 'root',
})
export class ConversationService {
  private readonly http = inject(HttpClient);

  private readonly controller = 'conversation';

  private url(action: string): string {
    return `/${this.controller}/${action}`;
  }

  create(data: CreateConversationDto): Observable<any> {
    return this.http.post(this.url('create'), data);
  }

  getConversations(): Observable<any> {
    return this.http.get(`/${this.controller}`);
  }

  getMessages(conversationId: string): Observable<any> {
    return this.http.get(this.url(`${conversationId}/messages`));
  }
}