import { prisma } from "@/db/client";
import { aiProvider } from "@/integrations/ai/openai";
import { emailProviders } from "@/integrations/email";
import { evaluateSendPolicy } from "./sendPolicy";
import type { NormalizedEmail } from "@/types/email";
import { trackPersonalizationSignal } from "./personalization";

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

async function getApprovalCategories(userId: string): Promise<string[]> {
  const rules = await prisma.userRule.findFirst({ where: { userId } });
  return asStringArray(rules?.approvalCategories);
}

export async function createDraft(userId: string, emailId: string, instruction = "Reply professionally and concisely") {
  const email = await prisma.normalizedEmail.findFirst({ where: { id: emailId, userId } });
  if (!email) throw new Error("Email not found");

  const draft = await aiProvider.draftReply(
    {
      id: email.id,
      accountId: email.accountId,
      provider: email.provider,
      threadId: email.threadId,
      senderEmail: email.senderEmail,
      recipients: email.recipients as string[],
      subject: email.subject,
      bodyText: email.bodyText,
      bodyHtml: email.bodyHtml ?? undefined,
      receivedAt: email.receivedAt.toISOString(),
      labels: email.labels as string[],
      attachments: email.attachments as [],
      rawImportanceScore: email.rawImportance,
      aiClassification: email.triageClass,
      aiSummary: email.aiSummary ?? undefined,
      aiActionItems: asStringArray(email.aiActionItems),
      aiDeadline: email.aiDeadline ?? undefined,
      aiDraftReply: email.aiDraftReply ?? undefined,
      riskLevel: email.riskLevel,
      riskCategories: asStringArray(email.riskCategories) as NormalizedEmail["riskCategories"],
      requiresApproval: email.requiresApproval,
      status: email.status,
      confidence: email.confidence
    },
    instruction
  );

  const updated = await prisma.normalizedEmail.update({
    where: { id: email.id },
    data: { aiDraftReply: draft, status: "draft_ready", requiresApproval: true }
  });

  await prisma.draftRevision.create({
    data: {
      userId,
      emailId: email.id,
      previousDraft: email.aiDraftReply ?? null,
      newDraft: draft,
      editedBy: "ai"
    }
  });

  await prisma.activityLog.create({
    data: {
      userId,
      emailId: email.id,
      action: "draft_created",
      status: "ok",
      metadata: { instruction }
    }
  });

  await trackPersonalizationSignal(userId, "importance_overridden", { source: "ai_draft_created" }, email.id);

  return updated;
}

export async function editDraft(userId: string, emailId: string, editedDraft: string) {
  const email = await prisma.normalizedEmail.findFirst({ where: { id: emailId, userId } });
  if (!email) throw new Error("Email not found");

  const updated = await prisma.normalizedEmail.update({
    where: { id: email.id },
    data: { aiDraftReply: editedDraft, status: "draft_ready", requiresApproval: true }
  });

  await prisma.draftRevision.create({
    data: {
      userId,
      emailId: email.id,
      previousDraft: email.aiDraftReply ?? null,
      newDraft: editedDraft,
      editedBy: "user"
    }
  });

  await prisma.activityLog.create({
    data: {
      userId,
      emailId: email.id,
      action: "draft_edited",
      status: "ok",
      metadata: { length: editedDraft.length }
    }
  });

  await trackPersonalizationSignal(userId, "draft_edited", { editedLength: editedDraft.length }, email.id);

  return updated;
}

export async function approveAndSendDraft(
  userId: string,
  emailId: string,
  explicitApproval = true,
  expectedAccountId?: string
) {
  const email = await prisma.normalizedEmail.findFirst({ where: { id: emailId, userId }, include: { account: true } });
  if (!email) throw new Error("Email not found");
  if (expectedAccountId && email.accountId !== expectedAccountId) {
    throw new Error("Account mismatch: send blocked to prevent wrong-account delivery");
  }
  if (!email.account.draftingEnabled) {
    return { sent: false, reason: "Drafting disabled on this account" };
  }
  if (!email.account.autoActionsEnabled && !explicitApproval) {
    return { sent: false, reason: "Auto actions disabled for this account" };
  }

  const decision = evaluateSendPolicy({
    riskLevel: email.riskLevel,
    riskCategories: asStringArray(email.riskCategories),
    userApprovalCategories: await getApprovalCategories(userId),
    explicitApproval
  });

  if (!decision.canSend) {
    await prisma.activityLog.create({
      data: {
        userId,
        emailId,
        action: "send_blocked",
        status: "blocked",
        metadata: { reason: decision.reason, accountId: email.accountId }
      }
    });

    return { sent: false, reason: decision.reason };
  }

  const adapter = emailProviders[email.provider];
  const account = {
    id: email.account.id,
    userId,
    provider: email.provider,
    accountEmail: email.account.accountEmail,
    accessToken: email.account.accessToken,
    refreshToken: email.account.refreshToken
  };

  await adapter.sendReply(account, email.threadId, email.aiDraftReply ?? "");

  await prisma.normalizedEmail.update({
    where: { id: email.id },
    data: { status: "sent", requiresApproval: false }
  });

  await prisma.sentMessage.create({
    data: {
      userId,
      emailId: email.id,
      provider: email.provider,
      accountEmail: email.account.accountEmail,
      subject: email.subject,
      body: email.aiDraftReply ?? "",
      status: "sent"
    }
  });

  await prisma.activityLog.create({
    data: {
      userId,
      emailId: email.id,
      action: "draft_approved_and_sent",
      status: "ok",
      metadata: { provider: email.provider }
    }
  });

  await trackPersonalizationSignal(userId, "draft_approved", { provider: email.provider }, email.id);

  return { sent: true };
}

export async function rejectDraft(userId: string, emailId: string, reason: string) {
  const email = await prisma.normalizedEmail.findFirst({ where: { id: emailId, userId } });
  if (!email) throw new Error("Email not found");

  await prisma.normalizedEmail.update({
    where: { id: email.id },
    data: { status: "triaged", aiDraftReply: null }
  });

  await prisma.activityLog.create({
    data: {
      userId,
      emailId,
      action: "draft_rejected",
      status: "ok",
      metadata: { reason }
    }
  });

  await trackPersonalizationSignal(userId, "draft_rejected", { reason }, emailId);

  return { rejected: true };
}
