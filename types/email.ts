export type EmailProvider = "gmail" | "outlook";

export type TriageClassification =
  | "urgent"
  | "important"
  | "normal"
  | "low_priority"
  | "spam_promotional";

export type RiskLevel = "low" | "medium" | "high";

export type RiskCategory =
  | "legal"
  | "financial"
  | "medical"
  | "school"
  | "recruiting"
  | "security"
  | "sensitive_personal";

export interface AttachmentMetadata {
  filename: string;
  mimeType: string;
  sizeBytes: number;
}

export interface NormalizedEmail {
  id: string;
  accountId: string;
  provider: EmailProvider;
  threadId: string;
  senderName?: string;
  senderEmail: string;
  recipients: string[];
  subject: string;
  bodyText: string;
  bodyHtml?: string;
  receivedAt: string;
  labels: string[];
  attachments: AttachmentMetadata[];
  rawImportanceScore: number;
  aiClassification: TriageClassification;
  aiSummary?: string;
  aiActionItems: string[];
  aiDeadline?: string;
  aiDraftReply?: string;
  riskLevel: RiskLevel;
  riskCategories?: RiskCategory[];
  requiresApproval: boolean;
  status: "ingested" | "triaged" | "needs_approval" | "draft_ready" | "sent" | "archived";
  confidence: number;
}

export interface TriageResult {
  classification: TriageClassification;
  summary: string;
  actionNeeded: string[];
  deadline?: string;
  suggestedResponse: string;
  riskLevel: RiskLevel;
  riskCategories: RiskCategory[];
  requiresApproval: boolean;
  confidence: number;
}
