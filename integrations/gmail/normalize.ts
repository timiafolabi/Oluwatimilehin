import type { ProviderAccount } from "@/integrations/email/types";
import type { NormalizedEmail, AttachmentMetadata } from "@/types/email";
import type { GmailMessage, GmailMessagePart } from "./types";

function decodeBase64Url(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function readHeader(part: GmailMessagePart | undefined, name: string): string | undefined {
  if (!part?.headers) return undefined;
  const header = part.headers.find((item) => item.name.toLowerCase() === name.toLowerCase());
  return header?.value;
}

function collectBodies(part: GmailMessagePart | undefined): { text?: string; html?: string } {
  if (!part) return {};

  if (part.mimeType === "text/plain" && part.body?.data) {
    return { text: decodeBase64Url(part.body.data) };
  }

  if (part.mimeType === "text/html" && part.body?.data) {
    return { html: decodeBase64Url(part.body.data) };
  }

  const merged = { text: "", html: "" };
  for (const child of part.parts ?? []) {
    const body = collectBodies(child);
    if (body.text) merged.text += body.text;
    if (body.html) merged.html += body.html;
  }

  return { text: merged.text || undefined, html: merged.html || undefined };
}

function collectAttachments(part: GmailMessagePart | undefined, bucket: AttachmentMetadata[] = []): AttachmentMetadata[] {
  if (!part) return bucket;
  if (part.filename && part.body?.attachmentId) {
    bucket.push({
      filename: part.filename,
      mimeType: part.mimeType ?? "application/octet-stream",
      sizeBytes: part.body.size ?? 0
    });
  }
  for (const child of part.parts ?? []) {
    collectAttachments(child, bucket);
  }
  return bucket;
}

function parseSender(fromHeader: string | undefined): { senderName?: string; senderEmail: string } {
  if (!fromHeader) return { senderEmail: "unknown@example.com" };
  const emailMatch = fromHeader.match(/<(.+?)>/);
  const senderEmail = emailMatch?.[1] ?? fromHeader.trim();
  const senderName = fromHeader.replace(/<.+?>/, "").trim().replace(/^"|"$/g, "") || undefined;
  return { senderName, senderEmail };
}

export function normalizeGmailMessage(account: ProviderAccount, message: GmailMessage): NormalizedEmail {
  const payload = message.payload;
  const subject = readHeader(payload, "subject") ?? "(no subject)";
  const toHeader = readHeader(payload, "to") ?? account.accountEmail;
  const recipients = toHeader.split(",").map((value) => value.trim()).filter(Boolean);
  const { text, html } = collectBodies(payload);
  const { senderName, senderEmail } = parseSender(readHeader(payload, "from"));

  return {
    id: `${account.id}-${message.id}`,
    accountId: account.id,
    provider: "gmail",
    threadId: message.threadId,
    senderName,
    senderEmail,
    recipients,
    subject,
    bodyText: text ?? message.snippet ?? "",
    bodyHtml: html,
    receivedAt: message.internalDate ? new Date(Number(message.internalDate)).toISOString() : new Date().toISOString(),
    labels: message.labelIds ?? [],
    attachments: collectAttachments(payload),
    rawImportanceScore: 0,
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
