import type { RiskLevel } from "@/types/email";

export interface SendPolicyDecision {
  canSend: boolean;
  requiresApproval: boolean;
  reason: string;
}

export function evaluateSendPolicy(input: {
  riskLevel: RiskLevel;
  riskCategories: string[];
  userApprovalCategories: string[];
  explicitApproval: boolean;
}): SendPolicyDecision {
  if (input.riskLevel === "high") {
    return {
      canSend: false,
      requiresApproval: true,
      reason: "High-risk messages are never auto-sent"
    };
  }

  const categoryRequiresApproval = input.riskCategories.some((category) =>
    input.userApprovalCategories.includes(category)
  );

  if (input.riskLevel === "medium" || categoryRequiresApproval) {
    if (!input.explicitApproval) {
      return {
        canSend: false,
        requiresApproval: true,
        reason: "Medium-risk/category-sensitive message requires explicit approval"
      };
    }

    return { canSend: true, requiresApproval: false, reason: "Explicit approval provided" };
  }

  return { canSend: true, requiresApproval: false, reason: "Low risk send allowed" };
}
