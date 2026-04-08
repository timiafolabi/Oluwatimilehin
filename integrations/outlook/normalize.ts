import type { ProviderAccount } from "@/integrations/email/types";
import type { AttachmentMetadata, NormalizedEmail } from "@/types/email";
import type { GraphMessage } from "./types";

function stripHtml(value: string): string {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function mapRecipients(message: GraphMessage, accountEmail: string): string[] {
  const recipients = [...(message.toRecipients ?? []), ...(message.ccRecipients ?? [])]
    .map((recipient) => recipient.emailAddress?.address)
    .filter((value): value is string => Boolean(value));
  return recipients.length ? recipients : [accountFallback(message, accountEmail)];
}

function accountFallback(message: GraphMessage, accountEmail: string): string {
  return message.toRecipients?.[0]?.emailAddress?.address ?? accountEmail;
}

function mapAttachments(message: GraphMessage): AttachmentMetadata[] {
  return (message.attachments ?? []).map((attachment) => ({
    filename: attachment.name ?? "unnamed",
    mimeType: attachment.contentType ?? "application/octet-stream",
    sizeBytes: attachment.size ?? 0
  }));
}

export function normalizeOutlookMessage(account: ProviderAccount, message: GraphMessage): NormalizedEmail {
  const rawHtml = message.body?.contentType === "html" ? message.body.content ?? "" : "";
  const rawText = message.body?.contentType === "text" ? message.body.content ?? "" : stripHtml(rawHtml);
  const from = message.from?.emailAddress;

  const providerMetadata = [
    ...(message.categories ?? []),
    `outlook:importance:${message.importance ?? "normal"}`,
    message.internetMessageId ? `outlook:internetMessageId:${message.internetMessageId}` : null,
    message.webLink ? `outlook:webLink:${message.webLink}` : null
  ].filter((value): value is string => Boolean(value));

  return {
    id: `${account.id}-${message.id}`,
    accountId: account.id,
    provider: "outlook",
    threadId: message.conversationId ?? message.id,
    senderName: from?.name,
    senderEmail: from?.address ?? "unknown@example.com",
    recipients: mapRecipients(message, account.accountEmail),
    subject: message.subject ?? "(no subject)",
    bodyText: rawText,
    bodyHtml: rawHtml || undefined,
    receivedAt: message.receivedDateTime ?? new Date().toISOString(),
    labels: providerMetadata,
    attachments: mapAttachments(message),
    rawImportanceScore: message.importance === "high" ? 0.9 : message.importance === "low" ? 0.2 : 0.5,
    aiClassification: "normal",
    aiSummary: "",
    aiActionItems: [],
    aiDraftReply: "",
    riskLevel: "medium",
    requiresApproval: true,
    status: "ingested",
    confidence: 0
  };
}
