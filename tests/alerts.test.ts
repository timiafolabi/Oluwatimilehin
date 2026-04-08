import test from "node:test";
import assert from "node:assert/strict";
import { shouldSendAlert } from "@/services/alerts";

test("sends for urgent class", () => {
  const result = shouldSendAlert({
    classification: "urgent",
    senderEmail: "person@example.com",
    instantSmsCategories: [],
    mutedSenders: []
  });

  assert.equal(result, true);
});

test("suppresses muted sender", () => {
  const result = shouldSendAlert({
    classification: "important",
    senderEmail: "mute@example.com",
    instantSmsCategories: ["normal"],
    mutedSenders: ["mute@example.com"]
  });

  assert.equal(result, false);
});
