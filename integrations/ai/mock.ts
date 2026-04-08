import type { AIProvider } from "./types";
import type { AgentAction } from "@/types/actions";
import type { NormalizedEmail, TriageResult, RiskCategory } from "@/types/email";
import { detectRiskCategories } from "@/services/rules";

function classifyText(subject: string, body: string): TriageResult["classification"] {
  const combined = `${subject} ${body}`.toLowerCase();
  if (/unsubscribe|sale|promotion|coupon/.test(combined)) return "spam_promotional";
  if (/urgent|asap|immediately|today|security incident/.test(combined)) return "urgent";
  if (/follow up|review|approve|deadline|invoice/.test(combined)) return "important";
  if (/newsletter|digest|weekly update|fyi/.test(combined)) return "low_priority";
  return "normal";
}

function confidenceFromSignals(subject: string, body: string): number {
  const indicators = [/urgent|asap|security|invoice|deadline/i, /newsletter|promotion|unsubscribe/i, /please|thanks|review/i];
  const signalCount = indicators.reduce((count, regex) => count + (regex.test(`${subject} ${body}`) ? 1 : 0), 0);
  const promoBoost = /sale|coupon|unsubscribe|promotion/i.test(`${subject} ${body}`) ? 0.22 : 0;
  return Math.min(0.98, 0.45 + signalCount * 0.18 + promoBoost);
}

function riskFromCategories(categories: RiskCategory[]): TriageResult["riskLevel"] {
  if (categories.includes("security") || categories.includes("legal") || categories.includes("financial")) return "high";
  if (categories.length > 0) return "medium";
  return "low";
}

export class MockAIProvider implements AIProvider {
  async triageEmail(email: NormalizedEmail): Promise<TriageResult> {
    const classification = classifyText(email.subject, email.bodyText);
    const riskCategories = detectRiskCategories(email.subject, email.bodyText);
    const confidence = confidenceFromSignals(email.subject, email.bodyText);

    return {
      classification,
      summary: email.bodyText.slice(0, 200),
      actionNeeded:
        classification === "urgent" || classification === "important" ? ["Review and respond"] : ["No immediate action"],
      deadline: /today|tomorrow|\d{1,2}\/\d{1,2}|\d{4}-\d{2}-\d{2}/i.test(email.bodyText) ? "detected-in-body" : undefined,
      suggestedResponse:
        classification === "spam_promotional"
          ? "No response needed. Consider archiving."
          : "Thanks for the message — I will review and reply shortly.",
      riskLevel: riskFromCategories(riskCategories),
      riskCategories,
      requiresApproval: riskCategories.length > 0,
      confidence
    };
  }

  async draftReply(_email: NormalizedEmail, instruction: string): Promise<string> {
    return `Draft based on instruction: ${instruction}`;
  }

  async interpretCommand(input: string, contextEmailId?: string): Promise<AgentAction> {
    const lowered = input.toLowerCase();
    if (lowered.startsWith("archive")) {
      return { type: "archive", emailId: contextEmailId, requiresApproval: false, reason: "User requested archive" };
    }
    if (lowered.startsWith("reply and send")) {
      return { type: "reply_and_send", emailId: contextEmailId, requiresApproval: true, reason: "Potential outbound send" };
    }
    if (lowered.startsWith("draft")) {
      return { type: "draft_reply", emailId: contextEmailId, requiresApproval: false, reason: "Draft requested" };
    }
    return { type: "unknown", emailId: contextEmailId, requiresApproval: true, reason: "Ambiguous command" };
  }
}
