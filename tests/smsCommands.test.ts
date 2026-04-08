import test from "node:test";
import assert from "node:assert/strict";
import { parseSmsCommand } from "@/services/smsCommands";

test("parses draft reply command", () => {
  const action = parseSmsCommand("draft reply saying Thanks for the update", "e-1");
  assert.equal(action.type, "draft_reply");
  assert.equal(action.payload?.message, "thanks for the update");
});

test("parses ignore command", () => {
  const action = parseSmsCommand("ignore messages like this", "e-1");
  assert.equal(action.type, "ignore_similar");
});

test("ambiguous command falls back to draft", () => {
  const action = parseSmsCommand("do whatever", "e-1");
  assert.equal(action.type, "draft_reply");
  assert.equal(action.requiresApproval, true);
});
