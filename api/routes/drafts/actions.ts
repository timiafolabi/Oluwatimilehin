import { approveAndSendDraft, createDraft, editDraft, rejectDraft } from "@/services/drafts";

export async function createReplyDraft(params: { userId: string; emailId: string; instruction?: string }) {
  return createDraft(params.userId, params.emailId, params.instruction);
}

export async function approveDraftAndSend(params: { userId: string; emailId: string; explicitApproval?: boolean; expectedAccountId?: string }) {
  return approveAndSendDraft(params.userId, params.emailId, params.explicitApproval ?? true, params.expectedAccountId);
}

export async function editDraftBeforeSend(params: { userId: string; emailId: string; editedDraft: string }) {
  return editDraft(params.userId, params.emailId, params.editedDraft);
}

export async function rejectReplyDraft(params: { userId: string; emailId: string; reason: string }) {
  return rejectDraft(params.userId, params.emailId, params.reason);
}
