import { prisma } from "@/db/client";
import { smsProvider } from "@/integrations/sms/twilio";
import type { NormalizedEmail } from "@/types/email";
import { toAppError } from "@/utils/errors";

function shortSummary(email: NormalizedEmail): string {
  const summary = email.aiSummary ?? email.bodyText;
  return summary.replace(/\s+/g, " ").slice(0, 120);
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export function shouldSendAlert(params: {
  classification: string;
  senderEmail: string;
  instantSmsCategories: string[];
  mutedSenders: string[];
}): boolean {
  if (params.mutedSenders.includes(params.senderEmail)) return false;
  const shouldAlertByClass = ["urgent", "important"].includes(params.classification);
  const shouldAlertByPreference = params.instantSmsCategories.includes(params.classification);
  return shouldAlertByClass || shouldAlertByPreference;
}

export async function maybeSendAlert(userId: string, phoneNumber: string | null | undefined, email: NormalizedEmail) {
  try {
    if (!phoneNumber) return null;

    const rules = await prisma.userRule.findFirst({ where: { userId } });
    const instantSmsCategories = asStringArray(rules?.instantSmsCategories);
    const mutedSenders = asStringArray(rules?.mutedSenders);

    if (
      !shouldSendAlert({
        classification: email.aiClassification,
        senderEmail: email.senderEmail,
        instantSmsCategories,
        mutedSenders
      })
    ) {
      return null;
    }

    const result = await smsProvider.send({
      to: phoneNumber,
      body: `[${email.aiClassification.toUpperCase()}] ${email.subject}\n${shortSummary(email)}\nReply: summarize | archive | draft reply saying ...`
    });

    await prisma.smsEvent.create({
      data: {
        userId,
        emailId: email.id,
        direction: "outbound",
        body: `alert:${email.aiClassification}:${email.subject}`,
        interpretedAction: "alert",
        status: result.providerMessageId
      }
    });

    await prisma.activityLog.create({
      data: {
        userId,
        emailId: email.id,
        action: "sms_alert_sent",
        status: "ok",
        metadata: {
          provider: result.provider,
          providerMessageId: result.providerMessageId,
          classification: email.aiClassification,
          reason: "classification_or_instant_sms_category_match"
        }
      }
    });

    return result;
  } catch (error) {
    throw toAppError(error, "SMS_ALERT_FAILED", { userId, emailId: email.id });
  }
}
