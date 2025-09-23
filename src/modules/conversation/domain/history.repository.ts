import { Message } from './message';

export interface HistoryRepository {
  append(conversationId: string, msg: Message): Promise<void>;
  list(conversationId: string, limit?: number): Promise<Message[]>;
  clear(conversationId: string): Promise<void>;
}
