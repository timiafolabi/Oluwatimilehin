import test from "node:test";
import assert from "node:assert/strict";
import { runTriage } from "@/services/triage";
import type { NormalizedEmail } from "@/types/email";

function baseEmail(overrides: Partial<NormalizedEmail>): NormalizedEmail {
  return {
    id: "e-1",
    accountId: "a-1",
    provider: "gmail",
    threadId: "t-1",
    senderEmail: "sender@example.com",
    recipients: ["user@example.com"],
    subject: "hello",
    bodyText: "general note",
    receivedAt: new Date().toISOString(),
    labels: [],
    attachments: [],
    rawImportanceScore: 0,
    aiClassification: "normal",
    aiActionItems: [],
    riskLevel: "low",
    riskCategories: [],
    requiresApproval: false,
    status: "ingested",
    confidence: 0,
    ...overrides
  };
}

test("triage marks security emails as high risk and needs approval", async () => {
  const email = baseEmail({
    subject: "Security alert",
    bodyText: "Please reset password and verify account login immediately"
  });

  const result = await runTriage(email);
  assert.equal(result.status, "needs_approval");
  assert.equal(result.riskLevel, "high");
  assert.ok(result.riskCategories?.includes("security"));
});

test("triage marks low confidence output for manual review", async () => {
  const email = baseEmail({
    subject: "quick note",
    bodyText: "hi"
  });

  const result = await runTriage(email);
  assert.equal(result.requiresApproval, true);
  assert.equal(result.status, "needs_approval");
});

test("triage can classify promotional content", async () => {
  const email = baseEmail({
    subject: "50% OFF sale",
    bodyText: "Limited time coupon. unsubscribe anytime."
  });

  const result = await runTriage(email);
  assert.equal(result.aiClassification, "spam_promotional");
});
