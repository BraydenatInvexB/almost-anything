export interface LiveChatMessage {
  id: string;
  sessionId: string;
  authorType: "visitor" | "staff" | "system";
  authorName: string;
  body: string;
  createdAt: string;
}

export interface LiveChatSession {
  id: string;
  visitorName: string;
  visitorEmail: string;
  status: "open" | "closed";
  assignedTo?: string;
  messages: LiveChatMessage[];
  createdAt: string;
  updatedAt: string;
}
