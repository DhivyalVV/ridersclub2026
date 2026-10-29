import { Injectable, MessageEvent } from '@nestjs/common';
import { Observable, Subject, filter, map } from 'rxjs';
import type { DirectMessagingRealtimeEvent } from '@ridersclub/types';

@Injectable()
export class MessagingRealtimeService {
  private readonly eventSubject = new Subject<DirectMessagingRealtimeEvent>();

  emitEvent(event: DirectMessagingRealtimeEvent): void {
    this.eventSubject.next(event);
  }

  subscribeForUser(userId: string): Observable<MessageEvent> {
    return this.eventSubject.asObservable().pipe(
      filter((event) => event.recipientUserIds.includes(userId)),
      map((event) => ({
        type: event.type,
        data: event,
      })),
    );
  }
}

