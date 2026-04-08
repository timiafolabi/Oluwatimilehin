import { aiProvider } from "@/integrations/ai/openai";
import type { AIProvider } from "@/integrations/ai/types";
import type { NormalizedEmail } from "@/types/email";
import { env } from "@/utils/env";
import { detectRiskCategories, requiresApprovalByPolicy } from "./rules";

export async function runTriage(email: NormalizedEmail, provider: AIProvider = aiProvider): Promise<NormalizedEmail> {
  const result = await provider.triageEmail(email);
  const confidenceOk = result.confidence >= env.confidenceThreshold;
  const ruleCategories = detectRiskCategories(email.subject, email.bodyText);
  const categories = Array.from(new Set([...(result.riskCategories ?? []), ...ruleCategories]));

  const policyApproval = requiresApprovalByPolicy(result.riskLevel, categories);
  const manualReview = !confidenceOk;

  return {
    ...email,
    aiClassification: confidenceOk ? result.classification : "important",
    aiSummary: result.summary,
    aiActionItems: result.actionNeeded,
    aiDeadline: result.deadline,
    aiDraftReply: result.suggestedResponse,
    riskLevel: result.riskLevel,
    riskCategories: categories,
    requiresApproval: result.requiresApproval || policyApproval || manualReview,
    status: result.requiresApproval || policyApproval || manualReview ? "needs_approval" : "triaged",
    confidence: result.confidence
  };
}
