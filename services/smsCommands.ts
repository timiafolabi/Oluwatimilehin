import type { AgentAction } from "@/types/actions";

export function parseSmsCommand(text: string, emailId?: string): AgentAction {
  const lowered = text.trim().toLowerCase();

  if (lowered === "summarize") {
    return { type: "summarize", emailId, requiresApproval: false, reason: "Requested summary" };
  }

  if (lowered === "archive") {
    return { type: "archive", emailId, requiresApproval: false, reason: "Requested archive" };
  }

  const draftMatch = lowered.match(/^draft\s+(a\s+)?reply\s+saying\s+(.+)/i);
  if (draftMatch?.[2]) {
    return {
      type: "draft_reply",
      emailId,
      requiresApproval: false,
      reason: "Draft reply requested",
      payload: { message: draftMatch[2] }
    };
  }

  const sendMatch = lowered.match(/^reply\s+and\s+send\s+(.+)/i);
  if (sendMatch?.[1]) {
    return {
      type: "reply_and_send",
      emailId,
      requiresApproval: true,
      reason: "Send requested by SMS",
      payload: { message: sendMatch[1] }
    };
  }

  if (lowered === "mark sender important") {
    return { type: "mark_sender_important", emailId, requiresApproval: false, reason: "Sender prioritization requested" };
  }

  if (lowered === "ignore messages like this" || lowered === "ignore messages like this in the future") {
    return { type: "ignore_similar", emailId, requiresApproval: false, reason: "Ignore pattern requested" };
  }

  return {
    type: "draft_reply",
    emailId,
    requiresApproval: true,
    reason: "Ambiguous command; converted to draft for confirmation",
    payload: { message: text.trim() }
  };
}
