import { prisma } from "@/db/client";
import type { NormalizedEmail } from "@/types/email";

export type PersonalizationSignalType =
  | "alert_clicked"
  | "alert_ignored"
  | "draft_approved"
  | "draft_edited"
  | "draft_rejected"
  | "importance_overridden";

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export async function trackPersonalizationSignal(
  userId: string,
  signalType: PersonalizationSignalType,
  payload: Record<string, string | number | boolean>,
  emailId?: string
) {
  return prisma.learningSignal.create({
    data: {
      userId,
      emailId,
      signalType,
      payload: payload as never
    }
  });
}

export async function updateSenderPreference(userId: string, senderEmail: string, mode: "important" | "muted") {
  const current = await prisma.userRule.findFirst({ where: { userId } });
  const important = new Set<string>(asStringArray(current?.importantSenders));
  const muted = new Set<string>(asStringArray(current?.mutedSenders));

  if (mode === "important") {
    important.add(senderEmail);
    muted.delete(senderEmail);
  } else {
    muted.add(senderEmail);
    important.delete(senderEmail);
  }

  if (!current) {
    return prisma.userRule.create({
      data: {
        userId,
        autoHandleLowRisk: false,
        importantSenders: Array.from(important),
        mutedSenders: Array.from(muted),
        instantSmsCategories: ["urgent", "important"],
        ignoredPatterns: [],
        approvalCategories: ["legal", "financial", "medical", "school", "recruiting", "security", "sensitive_personal"]
      }
    });
  }

  return prisma.userRule.update({
    where: { id: current.id },
    data: {
      importantSenders: Array.from(important),
      mutedSenders: Array.from(muted)
    }
  });
}

export async function updateInstantSmsCategories(userId: string, categories: string[]) {
  const current = await prisma.userRule.findFirst({ where: { userId } });
  if (!current) {
    return prisma.userRule.create({
      data: {
        userId,
        autoHandleLowRisk: false,
        importantSenders: [],
        mutedSenders: [],
        instantSmsCategories: categories,
        ignoredPatterns: [],
        approvalCategories: ["legal", "financial", "medical", "school", "recruiting", "security", "sensitive_personal"]
      }
    });
  }

  return prisma.userRule.update({ where: { id: current.id }, data: { instantSmsCategories: categories } });
}

export async function getPersonalizationSnapshot(userId: string) {
  const rules = await prisma.userRule.findFirst({ where: { userId } });
  const recentSignals = await prisma.learningSignal.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 50 });

  return {
    importantSenders: asStringArray(rules?.importantSenders),
    mutedSenders: asStringArray(rules?.mutedSenders),
    instantSmsCategories: asStringArray(rules?.instantSmsCategories),
    signals: recentSignals
  };
}

export function computePersonalizationAdjustedEmail(
  email: NormalizedEmail,
  snapshot: { importantSenders: string[]; mutedSenders: string[]; instantSmsCategories: string[]; signals: Array<{ signalType: string; emailId?: string | null; payload?: unknown }> }
): NormalizedEmail {
  let score = email.rawImportanceScore;
  const reasons: string[] = [];

  if (snapshot.importantSenders.includes(email.senderEmail)) {
    score += 0.35;
    reasons.push("important_sender");
  }

  if (snapshot.mutedSenders.includes(email.senderEmail)) {
    score -= 0.6;
    reasons.push("muted_sender");
  }

  if (snapshot.instantSmsCategories.includes(email.aiClassification)) {
    score += 0.2;
    reasons.push("instant_sms_category");
  }

  const senderSignals = snapshot.signals.filter((signal) => signal.emailId === email.id || (signal.payload as { senderEmail?: string } | undefined)?.senderEmail === email.senderEmail);
  for (const signal of senderSignals) {
    if (signal.signalType === "alert_clicked" || signal.signalType === "draft_approved") score += 0.1;
    if (signal.signalType === "alert_ignored" || signal.signalType === "draft_rejected") score -= 0.1;
    if (signal.signalType === "importance_overridden") score += 0.15;
  }

  const clamped = Math.max(0, Math.min(1, score));
  let newClass = email.aiClassification;

  if (clamped > 0.82 && ["normal", "low_priority"].includes(newClass)) {
    newClass = "important";
    reasons.push("score_upranked_to_important");
  }

  if (clamped < 0.2 && ["normal", "important"].includes(newClass)) {
    newClass = "low_priority";
    reasons.push("score_downranked_to_low_priority");
  }

  return {
    ...email,
    rawImportanceScore: clamped,
    aiClassification: newClass,
    aiActionItems: [...email.aiActionItems, `personalization:${reasons.join(",") || "none"}`]
  };
}

export async function applyPersonalizationScore(userId: string, email: NormalizedEmail): Promise<NormalizedEmail> {
  const snapshot = await getPersonalizationSnapshot(userId);
  return computePersonalizationAdjustedEmail(email, snapshot);
}
