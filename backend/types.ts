export interface Prompt {
  id: string;
  user_id: string;
  title: string;
  body: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}
