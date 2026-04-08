export type AgentActionType =
  | "summarize"
  | "archive"
  | "draft_reply"
  | "reply_and_send"
  | "mark_sender_important"
  | "ignore_similar"
  | "unknown";

export interface AgentAction {
  type: AgentActionType;
  emailId?: string;
  payload?: Record<string, string | boolean | number>;
  requiresApproval: boolean;
  reason: string;
}
