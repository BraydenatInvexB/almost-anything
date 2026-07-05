export type EmailSubscriberSource = "newsletter" | "customer" | "manual";
export type EmailSubscriberStatus = "active" | "unsubscribed";

export interface EmailSubscriber {
  id: string;
  email: string;
  name?: string;
  source: EmailSubscriberSource;
  status: EmailSubscriberStatus;
  subscribedAt: string;
  tags?: string[];
}

export type EmailAudience =
  | "all"
  | "subscribers"
  | "customers"
  | "vip"
  | "active_customers";

export type EmailBroadcastStatus = "draft" | "scheduled" | "sent";

export interface EmailBroadcast {
  id: string;
  subject: string;
  previewText?: string;
  body: string;
  audience: EmailAudience;
  status: EmailBroadcastStatus;
  recipientCount: number;
  sentAt?: string;
  scheduledAt?: string;
  createdBy: string;
  createdAt: string;
}
