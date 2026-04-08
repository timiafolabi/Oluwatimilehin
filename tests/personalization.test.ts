import test from "node:test";
import assert from "node:assert/strict";
import { computePersonalizationAdjustedEmail } from "@/services/personalization";
import type { NormalizedEmail } from "@/types/email";

function emailBase(overrides: Partial<NormalizedEmail>): NormalizedEmail {
  return {
    id: "email-1",
    accountId: "acct-1",
    provider: "gmail",
    threadId: "thread-1",
    senderEmail: "sender@example.com",
    recipients: ["me@example.com"],
    subject: "hello",
    bodyText: "test",
    receivedAt: new Date().toISOString(),
    labels: [],
    attachments: [],
    rawImportanceScore: 0.5,
    aiClassification: "normal",
    aiActionItems: [],
    riskLevel: "low",
    requiresApproval: false,
    status: "triaged",
    confidence: 0.9,
    ...overrides
  };
}

test("important sender increases score and up-ranks class", () => {
  const result = computePersonalizationAdjustedEmail(emailBase({ rawImportanceScore: 0.7 }), {
    importantSenders: ["sender@example.com"],
    mutedSenders: [],
    instantSmsCategories: ["important"],
    signals: []
  });

  assert.equal(result.aiClassification, "important");
  assert.ok(result.rawImportanceScore > 0.82);
});

test("muted sender down-ranks message", () => {
  const result = computePersonalizationAdjustedEmail(emailBase({ rawImportanceScore: 0.25 }), {
    importantSenders: [],
    mutedSenders: ["sender@example.com"],
    instantSmsCategories: [],
    signals: [{ signalType: "alert_ignored", emailId: "email-1" }]
  });

  assert.equal(result.aiClassification, "low_priority");
});
