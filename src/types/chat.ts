
import type { UserProfile } from '@/types';
import type { Timestamp } from 'firebase/firestore';

export type ChatContact = UserProfile & {
  lastMessage?: string;
  lastMessageTime?: string;
  unread?: number;
};

export type Message = {
  id: string;
  senderId: string;
  text: string;
  timestamp?: Timestamp | Date;
  own: boolean;
  status?: 'sending' | 'sent' | 'failed';
};

    