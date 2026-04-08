import type { RiskCategory, RiskLevel } from "@/types/email";

const approvalCategories: RiskCategory[] = [
  "legal",
  "financial",
  "medical",
  "school",
  "recruiting",
  "security",
  "sensitive_personal"
];

export function detectRiskCategories(subject: string, body: string): RiskCategory[] {
  const haystack = `${subject} ${body}`.toLowerCase();
  const map: Record<RiskCategory, RegExp> = {
    legal: /contract|nda|lawsuit|attorney|legal/,
    financial: /invoice|payment|wire|bank|refund|financial|tax/,
    medical: /medical|doctor|diagnosis|prescription|health/,
    school: /school|university|grade|assignment|admission|teacher/,
    recruiting: /candidate|interview|offer|recruit|hiring/,
    security: /security|2fa|password|breach|login|account verify/,
    sensitive_personal: /ssn|social security|passport|dob|personal info|confidential/
  };

  return approvalCategories.filter((category) => map[category].test(haystack));
}

export function requiresApprovalByPolicy(riskLevel: RiskLevel, categories: RiskCategory[]): boolean {
  if (riskLevel === "high") return true;
  return categories.length > 0;
}

export function canAutoSend(riskLevel: RiskLevel, requiresApproval: boolean): boolean {
  if (riskLevel === "high") return false;
  return !requiresApproval;
}
