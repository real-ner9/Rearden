export type NotificationType =
  | "new_user"
  | "new_follow"
  | "interview_scheduled"
  | "message_received"
  | "status_change";

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  detail?: string;
  timestamp: Date;
  read: boolean;
  actionLabel?: string;
  actionPath?: string;
}
