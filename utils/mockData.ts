import type { ProviderAccount } from "@/integrations/email/types";
import type { NormalizedEmail } from "@/types/email";

export function makeMockEmail(account: ProviderAccount, id: string, subject: string): NormalizedEmail {
  return {
    id: `${account.id}-${id}`,
    accountId: account.id,
    provider: account.provider,
    threadId: `thread-${id}`,
    senderName: "Mock Sender",
    senderEmail: "sender@example.com",
    recipients: [account.accountEmail],
    subject,
    bodyText: `${subject}. Please handle this as needed.`,
    bodyHtml: `<p>${subject}. Please handle this as needed.</p>`,
    receivedAt: new Date().toISOString(),
    labels: ["INBOX"],
    attachments: [],
    rawImportanceScore: Math.random(),
    aiClassification: "normal",
    aiSummary: "",
    aiActionItems: [],
    aiDeadline: undefined,
    aiDraftReply: "",
    riskLevel: "medium",
    riskCategories: [],
    requiresApproval: true,
    status: "ingested",
    confidence: 0
  };
}
