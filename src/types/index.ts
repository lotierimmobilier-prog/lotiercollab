export type TaskStatus = string;
export type TaskRecurrence = '15d' | '30d' | '3m' | '6m' | '1y';

export interface KanbanColumn {
  id: string;
  label: string;
  dot_color: string;
  sort_order: number;
  created_at: string;
}
export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent';
export type MemberRole = 'collaborateur' | 'prestataire' | 'syndic';

export interface Project {
  id: string;
  name: string;
  color: string;
  parent_id: string | null;
  sort_order: number;
  default_recurrence: TaskRecurrence | null;
  is_private: boolean;
  owner_auth_user_id: string | null;
  created_at: string;
  children?: Project[];
}

export interface Member {
  id: string;
  full_name: string;
  initials: string;
  email: string | null;
  avatar_color: string;
  avatar_url: string | null;
  role: MemberRole;
  created_at: string;
  auth_user_id?: string | null;
}

export type NotificationType = 'task_assigned' | 'comment_added' | 'task_updated';

export interface Notification {
  id: string;
  recipient_member_id: string;
  type: NotificationType;
  title: string;
  body: string;
  task_id: string | null;
  read: boolean;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  project_id: string | null;
  assigned_to: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  created_by: string | null;
  parent_id: string | null;
  recurrence: TaskRecurrence | null;
  next_recurrence_date: string | null;
  created_at: string;
  updated_at: string;
  project?: Project;
  assignee?: Member;
  assignees?: Member[];
  creator?: Member;
  comment_count?: number;
}

export interface Comment {
  id: string;
  task_id: string;
  author_id: string | null;
  body: string;
  created_at: string;
  author?: Member;
}

export interface Copropriete {
  id: string;
  name: string;
  address: string;
  sort_order: number;
  active: boolean;
  created_at: string;
}

export interface Attachment {
  id: string;
  task_id: string;
  file_name: string;
  file_url: string;
  uploaded_by: string | null;
  created_at: string;
  uploader?: Member;
}

export interface MessageConversation {
  id: string;
  title: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  members?: Member[];
  last_message?: Message;
  unread_count?: number;
}

export interface MessageAttachment {
  id: string;
  message_id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  uploaded_by: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  author_id: string | null;
  body: string;
  reply_to_id: string | null;
  cited_task_id: string | null;
  cited_task_title: string | null;
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
  author?: Member;
  reply_to?: Message;
  attachments?: MessageAttachment[];
}

export interface MessagingTeam {
  id: string;
  name: string;
  created_at: string;
  members?: Member[];
}
