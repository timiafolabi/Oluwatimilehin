import { prisma } from "@/db/client";
import { ingestForAccount } from "@/services/ingestion";
import { maybeSendAlert } from "@/services/alerts";
import { logInfo } from "@/utils/logger";
import { toAppError } from "@/utils/errors";

export async function ingestAllAccounts(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { accounts: true }
    });

    if (!user) throw new Error("User not found");

    for (const account of user.accounts) {
      const triaged = await ingestForAccount(account);

      for (const email of triaged) {
        await prisma.normalizedEmail.upsert({
          where: { id: email.id },
          update: {
            triageClass: email.aiClassification,
            aiSummary: email.aiSummary,
            aiActionItems: email.aiActionItems,
            aiDraftReply: email.aiDraftReply,
            aiDeadline: email.aiDeadline,
            riskLevel: email.riskLevel,
            riskCategories: email.riskCategories ?? [],
            requiresApproval: email.requiresApproval,
            confidence: email.confidence,
            status: email.status
          },
          create: {
            id: email.id,
            userId,
            accountId: account.id,
            provider: email.provider,
            threadId: email.threadId,
            senderName: email.senderName,
            senderEmail: email.senderEmail,
            recipients: email.recipients as never,
            subject: email.subject,
            bodyText: email.bodyText,
            bodyHtml: email.bodyHtml,
            receivedAt: new Date(email.receivedAt),
            labels: email.labels as never,
            attachments: email.attachments as never,
            rawImportance: email.rawImportanceScore,
            triageClass: email.aiClassification,
            aiSummary: email.aiSummary,
            aiActionItems: email.aiActionItems as never,
            aiDraftReply: email.aiDraftReply,
            aiDeadline: email.aiDeadline,
            riskLevel: email.riskLevel,
            riskCategories: (email.riskCategories ?? []) as never,
            requiresApproval: email.requiresApproval,
            confidence: email.confidence,
            status: email.status
          }
        });

        await maybeSendAlert(userId, user.phoneNumber, email);
        logInfo("triage_saved", { userId, emailId: email.id, class: email.aiClassification });
        await prisma.activityLog.create({
          data: {
            userId,
            emailId: email.id,
            action: "classification_decision",
            status: "ok",
            metadata: {
              classification: email.aiClassification,
              confidence: email.confidence,
              reasons: email.aiActionItems,
              risk: email.riskLevel
            }
          }
        });
      }
    }

    return { ok: true };
  } catch (error) {
    throw toAppError(error, "INGEST_ALL_FAILED", { userId });
  }
}
