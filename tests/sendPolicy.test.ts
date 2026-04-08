import test from "node:test";
import assert from "node:assert/strict";
import { evaluateSendPolicy } from "@/services/sendPolicy";

test("high risk is never auto-sent", () => {
  const result = evaluateSendPolicy({
    riskLevel: "high",
    riskCategories: ["legal"],
    userApprovalCategories: [],
    explicitApproval: true
  });

  assert.equal(result.canSend, false);
});

test("medium risk requires explicit approval", () => {
  const result = evaluateSendPolicy({
    riskLevel: "medium",
    riskCategories: [],
    userApprovalCategories: [],
    explicitApproval: false
  });

  assert.equal(result.canSend, false);
  assert.equal(result.requiresApproval, true);
});

test("low risk can send", () => {
  const result = evaluateSendPolicy({
    riskLevel: "low",
    riskCategories: [],
    userApprovalCategories: [],
    explicitApproval: false
  });

  assert.equal(result.canSend, true);
});
