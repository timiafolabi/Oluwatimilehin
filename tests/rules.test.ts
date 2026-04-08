import test from "node:test";
import assert from "node:assert/strict";
import { detectRiskCategories, requiresApprovalByPolicy } from "@/services/rules";

test("detects legal and financial categories", () => {
  const categories = detectRiskCategories("Invoice + contract", "Please review payment terms with legal");
  assert.ok(categories.includes("legal"));
  assert.ok(categories.includes("financial"));
});

test("policy requires approval for high risk", () => {
  assert.equal(requiresApprovalByPolicy("high", []), true);
});
