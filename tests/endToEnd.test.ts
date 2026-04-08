import test from "node:test";
import assert from "node:assert/strict";
import { GmailAdapter } from "@/integrations/email/gmail";
import { OutlookAdapter } from "@/integrations/email/outlook";
import { shouldSendAlert } from "@/services/alerts";
import { parseSmsCommand } from "@/services/smsCommands";
import { runTriage } from "@/services/triage";
import type { NormalizedEmail } from "@/types/email";

const baseEmail: NormalizedEmail = {
  id: "e2e-1",
  accountId: "acc-1",
  provider: "gmail",
  threadId: "thread-1",
  senderEmail: "ceo@company.com",
  recipients: ["user@example.com"],
  subject: "Urgent legal contract review",
  bodyText: "Please review this contract today.",
  receivedAt: new Date().toISOString(),
  labels: [],
  attachments: [],
  rawImportanceScore: 0.4,
  aiClassification: "normal",
  aiActionItems: [],
  riskLevel: "medium",
  requiresApproval: false,
  status: "ingested",
  confidence: 0
};

test("gmail + outlook adapters can run together in mock mode", async () => {
  process.env.MOCK_MODE = "true";
  const gmail = new GmailAdapter();
  const outlook = new OutlookAdapter();

  const gmailEmails = await gmail.fetchRecentEmails({
    id: "g-1",
    userId: "u-1",
    provider: "gmail",
    accountEmail: "a@gmail.com",
    accessToken: "token"
  });

  const outlookEmails = await outlook.fetchRecentEmails({
    id: "o-1",
    userId: "u-1",
    provider: "outlook",
    accountEmail: "a@outlook.com",
    accessToken: "token"
  });

  assert.ok(gmailEmails.length > 0);
  assert.ok(outlookEmails.length > 0);
});

test("important email triggers sms alert decision", () => {
  assert.equal(
    shouldSendAlert({
      classification: "important",
      senderEmail: "sender@example.com",
      instantSmsCategories: [],
      mutedSenders: []
    }),
    true
  );
});

test("inbound sms draft command becomes draft reply", () => {
  const action = parseSmsCommand("draft reply saying Thank you, received", "e-1");
  assert.equal(action.type, "draft_reply");
});

test("ambiguous sms command triggers confirmation flow draft", () => {
  const action = parseSmsCommand("handle this", "e-1");
  assert.equal(action.type, "draft_reply");
  assert.equal(action.requiresApproval, true);
});

test("high-risk email requires approval after triage", async () => {
  const triaged = await runTriage(baseEmail);
  assert.equal(triaged.requiresApproval, true);
});
