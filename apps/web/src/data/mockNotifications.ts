export type NotificationType =
  | "new_user"
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

export const initialNotifications: Notification[] = [
  {
    id: "n1",
    type: "new_user",
    message: "New profile match",
    detail: "Sarah Chen matches your React Senior role — 92% fit",
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    read: false,
    actionLabel: "View Profile",
    actionPath: "/user/1",
  },
  {
    id: "n2",
    type: "interview_scheduled",
    message: "Interview confirmed",
    detail: "Alex Rivera — Tomorrow at 2:00 PM EST",
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    read: false,
  },
  {
    id: "n3",
    type: "message_received",
    message: "New message from Jordan Lee",
    detail: "Thanks for reaching out! I'd love to chat about the role...",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    read: true,
  },
  {
    id: "n4",
    type: "status_change",
    message: "Status updated",
    detail: "Morgan Blake moved to Final Round",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
    read: true,
  },
];

export const incomingNotifications: { notification: Notification; delayMs: number }[] = [
  {
    notification: {
      id: "n5",
      type: "new_user",
      message: "New profile match",
      detail: "Priya Sharma — 88% match for your Full Stack role",
      timestamp: new Date(),
      read: false,
      actionLabel: "View Profile",
      actionPath: "/user/2",
    },
    delayMs: 15_000,
  },
  {
    notification: {
      id: "n6",
      type: "message_received",
      message: "New message from Alex Rivera",
      detail: "Looking forward to our interview tomorrow!",
      timestamp: new Date(),
      read: false,
    },
    delayMs: 30_000,
  },
];
