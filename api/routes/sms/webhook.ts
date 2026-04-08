import { prisma } from "@/db/client";
import { parseSmsCommand } from "@/services/smsCommands";
import { trackLearningSignal } from "@/services/learning";
import { smsProvider } from "@/integrations/sms/twilio";
import { approveAndSendDraft, editDraft } from "@/services/drafts";
import { trackPersonalizationSignal, updateSenderPreference } from "@/services/personalization";

async function logOutboundSms(userId: string, emailId: string | undefined, body: string, action: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.phoneNumber) return;
  const result = await smsProvider.send({ to: user.phoneNumber, body });

  await prisma.smsEvent.create({
    data: {
      userId,
      emailId,
      direction: "outbound",
      body,
      interpretedAction: action,
      status: result.providerMessageId
    }
  });

  await prisma.activityLog.create({
    data: {
      userId,
      emailId,
      action: `sms_${action}`,
      status: "ok",
      metadata: { provider: result.provider, providerMessageId: result.providerMessageId }
    }
  });
}

async function resolveEmail(userId: string, emailId?: string) {
  if (emailId) {
    return prisma.normalizedEmail.findFirst({ where: { id: emailId, userId } });
  }

  return prisma.normalizedEmail.findFirst({
    where: { userId },
    orderBy: { receivedAt: "desc" }
  });
}

export async function handleInboundSms(input: { userId: string; body: string; emailId?: string }) {
  const action = parseSmsCommand(input.body, input.emailId);
  const email = await resolveEmail(input.userId, input.emailId);

  await prisma.smsEvent.create({
    data: {
      userId: input.userId,
      emailId: email?.id,
      direction: "inbound",
      body: input.body,
      interpretedAction: action.type,
      status: "processed"
    }
  });

  await prisma.activityLog.create({
    data: {
      userId: input.userId,
      emailId: email?.id,
      action: "sms_inbound",
      status: "ok",
      metadata: { action: action.type, reason: action.reason }
    }
  });

  if (!email) {
    await logOutboundSms(input.userId, undefined, "Could not find a related email. Reply with a valid message id.", "error");
    return action;
  }

  if (action.type === "summarize") {
    const text = `Summary: ${email.aiSummary ?? email.bodyText.slice(0, 140)}`;
    await trackPersonalizationSignal(input.userId, "alert_clicked", { via: "sms_summarize" }, email.id);
    await logOutboundSms(input.userId, email.id, text, "summarize");
    return action;
  }

  if (action.type === "archive") {
    await prisma.normalizedEmail.update({ where: { id: email.id }, data: { status: "archived" } });
    await logOutboundSms(input.userId, email.id, `Archived: ${email.subject}`, "archive");
    return action;
  }

  if (action.type === "draft_reply") {
    const draftText = String(action.payload?.message ?? "Thanks, received.");
    await prisma.normalizedEmail.update({
      where: { id: email.id },
      data: { aiDraftReply: draftText, status: "draft_ready", requiresApproval: true }
    });

    await trackLearningSignal(input.userId, "draft_created_from_sms", { draftText }, email.id);
    await logOutboundSms(
      input.userId,
      email.id,
      `Draft saved for \"${email.subject}\": ${draftText.slice(0, 100)}. Reply 'reply and send CONFIRM' to send.`,
      "draft_reply"
    );
    return action;
  }

  if (action.type === "reply_and_send") {
    const requestedText = String(action.payload?.message ?? "");
    await editDraft(input.userId, email.id, requestedText);
    const sendResult = await approveAndSendDraft(input.userId, email.id, true, email.accountId);

    if (!sendResult.sent) {
      await logOutboundSms(
        input.userId,
        email.id,
        "Send blocked by policy. Draft saved for dashboard approval.",
        "reply_blocked_draft"
      );
      return action;
    }

    await logOutboundSms(input.userId, email.id, `Sent reply for \"${email.subject}\".`, "reply_and_send");
    return action;
  }

  if (action.type === "mark_sender_important") {
    await updateSenderPreference(input.userId, email.senderEmail, "important");

    await trackLearningSignal(input.userId, "sender_marked_important", { sender: email.senderEmail }, email.id);
    await trackPersonalizationSignal(input.userId, "importance_overridden", { senderEmail: email.senderEmail }, email.id);
    await logOutboundSms(input.userId, email.id, `Sender marked important: ${email.senderEmail}`, "mark_sender_important");
    return action;
  }

  if (action.type === "ignore_similar") {
    const current = await prisma.userRule.findFirst({ where: { userId: input.userId } });
    const pattern = email.subject.toLowerCase();
    const ignores = new Set<string>((current?.ignoredPatterns as string[] | null) ?? []);
    ignores.add(pattern);

    if (!current) {
      await prisma.userRule.create({
        data: {
          userId: input.userId,
          autoHandleLowRisk: true,
          importantSenders: [],
          mutedSenders: [email.senderEmail],
          instantSmsCategories: ["urgent", "important"],
          ignoredPatterns: Array.from(ignores),
          approvalCategories: ["legal", "financial", "medical", "school", "recruiting", "security", "sensitive_personal"]
        }
      });
    } else {
      await prisma.userRule.update({ where: { id: current.id }, data: { ignoredPatterns: Array.from(ignores) } });
    }

    await updateSenderPreference(input.userId, email.senderEmail, "muted");
    await trackLearningSignal(input.userId, "ignore_pattern_added", { pattern }, email.id);
    await trackPersonalizationSignal(input.userId, "alert_ignored", { senderEmail: email.senderEmail }, email.id);
    await logOutboundSms(input.userId, email.id, `Will ignore similar messages to: ${email.subject}`, "ignore_similar");
    return action;
  }

  return action;
}
