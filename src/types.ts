export type Status = 'New' | 'In Progress' | 'Done';
export type Priority = 'P1' | 'P2' | 'P3';
export type Channel = 'email' | 'chat' | 'whatsapp' | 'web';

export type Category =
  | 'Billing'
  | 'Claims'
  | 'Endorsement'
  | 'General'
  | 'Urgent'
  | 'Spam';

export interface Sender {
  name: string;
  email: string;
}

export interface InboxItem {
  id: string;
  received_at: string;
  sender: Sender;
  subject: string;
  channel: Channel;
  status: Status;
  priority: Priority;
  body: string;
  tags: string[];
  notes?: string;
}

export interface AIResult {
  summary_bullets: string[];
  category: Category;
  priority: Priority;
  suggested_action: string;
  draft_reply: string;
  confidence: number;
}
